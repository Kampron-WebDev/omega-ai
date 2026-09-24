"use client"

import "@xyflow/react/dist/style.css"

import {
  useCallback,
  useEffect,
  useImperativeHandle,
  useMemo,
  useRef,
  useState,
  type DragEvent,
  type Ref,
} from "react"
import {
  useCanRedo,
  useCanUndo,
  useRedo,
  useRoom,
  useUndo,
} from "@liveblocks/react"
import { useLiveblocksFlow } from "@liveblocks/react-flow"
import {
  Background,
  BackgroundVariant,
  ConnectionMode,
  MiniMap,
  ReactFlow,
  type EdgeProps,
  type EdgeTypes,
  type NodeTypes,
  type NodeProps,
  type ReactFlowInstance,
} from "@xyflow/react"

import { CanvasControls } from "@/components/editor/canvas-controls"
import { CanvasEdgeRenderer } from "@/components/editor/canvas-edge"
import { CanvasNodeRenderer } from "@/components/editor/canvas-node"
import { CanvasDragPreview } from "@/components/editor/canvas-drag-preview"
import { CanvasShapePanel } from "@/components/editor/canvas-shape-panel"
import type { CanvasTemplate } from "@/components/editor/starter-templates"
import {
  CANVAS_ZOOM_DURATION_MS,
  useKeyboardShortcuts,
} from "@/hooks/use-keyboard-shortcuts"
import { NEW_EDGE_OPTIONS } from "@/lib/canvas-edge-options"
import {
  CANVAS_SHAPE_DRAG_TYPE,
  parseCanvasShapeDragPayload,
  type CanvasShapeDragPayload,
} from "@/lib/canvas-drag"
import {
  DEFAULT_NODE_COLOR,
  type CanvasEdge,
  type CanvasNode,
} from "@/types/canvas"

/** Canvas actions the workspace chrome triggers from outside the room. */
interface CanvasFlowHandle {
  /** Replaces the whole canvas with the template, then fits the view to it. */
  importTemplate: (template: CanvasTemplate) => void
}

interface CanvasFlowProps {
  ref?: Ref<CanvasFlowHandle>
}

let nodeCounter = 0

function createCanvasNodeId(shape: CanvasNode["data"]["shape"]): string {
  nodeCounter += 1
  return `${shape}-${Date.now()}-${nodeCounter}`
}

/**
 * Renders inside `CanvasRoom`'s `ClientSideSuspense`, so Liveblocks Storage is
 * already loaded by the time this mounts — `useLiveblocksFlow`'s `suspense:
 * true` guarantees `nodes`/`edges` are arrays here, never `null`.
 */
function CanvasFlow({ ref }: CanvasFlowProps) {
  const { nodes, edges, onNodesChange, onEdgesChange, onConnect, onDelete } =
    useLiveblocksFlow<CanvasNode, CanvasEdge>({
      nodes: { initial: [] },
      edges: { initial: [] },
      suspense: true,
    })
  const [flowInstance, setFlowInstance] = useState<ReactFlowInstance<
    CanvasNode,
    CanvasEdge
  > | null>(null)
  const room = useRoom()
  const undo = useUndo()
  const redo = useRedo()
  const canUndo = useCanUndo()
  const canRedo = useCanRedo()
  const nodesRef = useRef(nodes)
  const edgesRef = useRef(edges)
  const [dragPreview, setDragPreview] = useState<{
    payload: CanvasShapeDragPayload
    position: { x: number; y: number }
  } | null>(null)

  useEffect(() => {
    nodesRef.current = nodes
  }, [nodes])

  useEffect(() => {
    edgesRef.current = edges
  }, [edges])

  const updateNodeData = useCallback(
    (nodeId: string, data: Partial<CanvasNode["data"]>) => {
      const node = nodesRef.current.find(({ id }) => id === nodeId)

      if (!node) {
        return
      }

      onNodesChange([
        {
          type: "replace",
          id: nodeId,
          item: { ...node, data: { ...node.data, ...data } },
        },
      ])
    },
    [onNodesChange]
  )
  const updateEdgeData = useCallback(
    (edgeId: string, data: Partial<CanvasEdge["data"]>) => {
      const edge = edgesRef.current.find(({ id }) => id === edgeId)

      if (!edge) {
        return
      }

      onEdgesChange([
        {
          type: "replace",
          id: edgeId,
          item: { ...edge, data: { label: "", ...edge.data, ...data } },
        },
      ])
    },
    [onEdgesChange]
  )
  const nodeTypes = useMemo(
    () =>
      ({
        canvasNode: (props: NodeProps<CanvasNode>) => (
          <CanvasNodeRenderer
            {...props}
            onLabelChange={(nodeId, label) =>
              updateNodeData(nodeId, { label })
            }
            onColorChange={(nodeId, color) =>
              updateNodeData(nodeId, { color })
            }
          />
        ),
      }) satisfies NodeTypes,
    [updateNodeData]
  )
  const edgeTypes = useMemo(
    () =>
      ({
        canvasEdge: (props: EdgeProps<CanvasEdge>) => (
          <CanvasEdgeRenderer
            {...props}
            onLabelChange={(edgeId, label) =>
              updateEdgeData(edgeId, { label })
            }
          />
        ),
      }) satisfies EdgeTypes,
    [updateEdgeData]
  )

  useKeyboardShortcuts({ flowInstance, undo, redo })

  useImperativeHandle(
    ref,
    () => ({
      importTemplate(template) {
        // One batch: collaborators receive the swap as a single update, and a
        // single undo restores the previous canvas.
        room.batch(() => {
          onEdgesChange(
            edgesRef.current.map(({ id }) => ({ type: "remove", id }))
          )
          onNodesChange(
            nodesRef.current.map(({ id }) => ({ type: "remove", id }))
          )
          onNodesChange(
            template.nodes.map((node) => ({ type: "add", item: node }))
          )
          onEdgesChange(
            template.edges.map((edge) => ({ type: "add", item: edge }))
          )
        })

        // React Flow queues this until the new nodes reach it, then fits them.
        void flowInstance?.fitView({ duration: CANVAS_ZOOM_DURATION_MS })
      },
    }),
    [room, flowInstance, onNodesChange, onEdgesChange]
  )

  const updateDragPreviewPosition = useCallback(
    (position: { x: number; y: number }) => {
      setDragPreview((current) =>
        current ? { ...current, position } : current
      )
    },
    []
  )

  const handleDragOver = useCallback((event: DragEvent<HTMLDivElement>) => {
    if (!event.dataTransfer.types.includes(CANVAS_SHAPE_DRAG_TYPE)) {
      return
    }

    event.preventDefault()
    event.dataTransfer.dropEffect = "copy"
  }, [])

  const handleDrop = useCallback(
    (event: DragEvent<HTMLDivElement>) => {
      const payload = parseCanvasShapeDragPayload(
        event.dataTransfer.getData(CANVAS_SHAPE_DRAG_TYPE)
      )

      setDragPreview(null)

      if (!flowInstance || !payload) {
        return
      }

      event.preventDefault()

      const position = flowInstance.screenToFlowPosition({
        x: event.clientX,
        y: event.clientY,
      })
      const node: CanvasNode = {
        id: createCanvasNodeId(payload.shape),
        type: "canvasNode",
        position,
        origin: [0.5, 0.5],
        width: payload.width,
        height: payload.height,
        data: {
          label: "",
          color: DEFAULT_NODE_COLOR,
          shape: payload.shape,
        },
      }

      onNodesChange([{ type: "add", item: node }])
    },
    [flowInstance, onNodesChange]
  )

  return (
    <ReactFlow
      nodes={nodes}
      edges={edges}
      nodeTypes={nodeTypes}
      edgeTypes={edgeTypes}
      defaultEdgeOptions={NEW_EDGE_OPTIONS}
      onNodesChange={onNodesChange}
      onEdgesChange={onEdgesChange}
      onConnect={onConnect}
      onDelete={onDelete}
      onInit={setFlowInstance}
      onDragOver={handleDragOver}
      onDrop={handleDrop}
      connectionMode={ConnectionMode.Loose}
      fitView
      className="bg-background"
    >
      <Background variant={BackgroundVariant.Dots} />
      <MiniMap />
      <CanvasControls
        onZoomIn={() =>
          void flowInstance?.zoomIn({ duration: CANVAS_ZOOM_DURATION_MS })
        }
        onZoomOut={() =>
          void flowInstance?.zoomOut({ duration: CANVAS_ZOOM_DURATION_MS })
        }
        onFitView={() =>
          void flowInstance?.fitView({ duration: CANVAS_ZOOM_DURATION_MS })
        }
        onUndo={undo}
        onRedo={redo}
        canUndo={canUndo}
        canRedo={canRedo}
      />
      <CanvasShapePanel
        onShapeDragStart={(payload, position) =>
          setDragPreview({ payload, position })
        }
        onShapeDrag={updateDragPreviewPosition}
        onShapeDragEnd={() => setDragPreview(null)}
      />
      {dragPreview ? (
        <CanvasDragPreview
          payload={dragPreview.payload}
          position={dragPreview.position}
        />
      ) : null}
    </ReactFlow>
  )
}

export { CanvasFlow, createCanvasNodeId }
export type { CanvasFlowHandle }

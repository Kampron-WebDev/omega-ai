"use client"

import "@xyflow/react/dist/style.css"

import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type DragEvent,
} from "react"
import { useLiveblocksFlow } from "@liveblocks/react-flow"
import {
  Background,
  BackgroundVariant,
  ConnectionMode,
  MiniMap,
  ReactFlow,
  type NodeTypes,
  type NodeProps,
  type ReactFlowInstance,
} from "@xyflow/react"

import { CanvasNodeRenderer } from "@/components/editor/canvas-node"
import { CanvasDragPreview } from "@/components/editor/canvas-drag-preview"
import { CanvasShapePanel } from "@/components/editor/canvas-shape-panel"
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
function CanvasFlow() {
  const { nodes, edges, onNodesChange, onEdgesChange, onConnect, onDelete } =
    useLiveblocksFlow<CanvasNode, CanvasEdge>({
      nodes: { initial: [] },
      edges: { initial: [] },
      suspense: true,
    })
  const flowInstanceRef = useRef<ReactFlowInstance<
    CanvasNode,
    CanvasEdge
  > | null>(null)
  const nodesRef = useRef(nodes)
  const [dragPreview, setDragPreview] = useState<{
    payload: CanvasShapeDragPayload
    position: { x: number; y: number }
  } | null>(null)

  useEffect(() => {
    nodesRef.current = nodes
  }, [nodes])

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
      const flowInstance = flowInstanceRef.current
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
    [onNodesChange]
  )

  return (
    <ReactFlow
      nodes={nodes}
      edges={edges}
      nodeTypes={nodeTypes}
      onNodesChange={onNodesChange}
      onEdgesChange={onEdgesChange}
      onConnect={onConnect}
      onDelete={onDelete}
      onInit={(instance) => {
        flowInstanceRef.current = instance
      }}
      onDragOver={handleDragOver}
      onDrop={handleDrop}
      connectionMode={ConnectionMode.Loose}
      fitView
      className="bg-background"
    >
      <Background variant={BackgroundVariant.Dots} />
      <MiniMap />
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

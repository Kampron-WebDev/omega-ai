"use client"

import "@xyflow/react/dist/style.css"

import { useLiveblocksFlow } from "@liveblocks/react-flow"
import {
  Background,
  BackgroundVariant,
  ConnectionMode,
  MiniMap,
  ReactFlow,
} from "@xyflow/react"

import type { CanvasEdge, CanvasNode } from "@/types/canvas"

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

  return (
    <ReactFlow
      nodes={nodes}
      edges={edges}
      onNodesChange={onNodesChange}
      onEdgesChange={onEdgesChange}
      onConnect={onConnect}
      onDelete={onDelete}
      connectionMode={ConnectionMode.Loose}
      fitView
      className="bg-background"
    >
      <Background variant={BackgroundVariant.Dots} />
      <MiniMap />
    </ReactFlow>
  )
}

export { CanvasFlow }

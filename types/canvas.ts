import type { Edge, Node } from "@xyflow/react"

/**
 * The canvas node color palette, per `context/ui-context.md`. Each pair is a
 * dark node fill tuned for readability against the app's near-black canvas
 * plus a vivid contrasting text color — not component styling, so the raw
 * hex values are appropriate here (same reasoning as `lib/liveblocks.ts`'s
 * `CURSOR_COLORS`).
 */
const NODE_COLORS = [
  { id: "neutral", fill: "#1F1F1F", text: "#EDEDED" },
  { id: "blue", fill: "#10233D", text: "#52A8FF" },
  { id: "purple", fill: "#2E1938", text: "#BF7AF0" },
  { id: "orange", fill: "#331B00", text: "#FF990A" },
  { id: "red", fill: "#3C1618", text: "#FF6166" },
  { id: "pink", fill: "#3A1726", text: "#F75F8F" },
  { id: "green", fill: "#0F2E18", text: "#62C073" },
  { id: "teal", fill: "#062822", text: "#0AC7B4" },
] as const

type NodeColorId = (typeof NODE_COLORS)[number]["id"]

/** The six supported node shapes, per `context/ui-context.md`. */
const NODE_SHAPES = [
  "rectangle",
  "diamond",
  "circle",
  "pill",
  "cylinder",
  "hexagon",
] as const

type NodeShapeId = (typeof NODE_SHAPES)[number]

const DEFAULT_NODE_COLOR: NodeColorId = "neutral"
const DEFAULT_NODE_SHAPE: NodeShapeId = "rectangle"

interface CanvasNodeData extends Record<string, unknown> {
  label: string
  color: NodeColorId
  shape: NodeShapeId
}

/**
 * The canvas's React Flow node and edge types, synced through Liveblocks
 * Storage by `useLiveblocksFlow` (see `components/editor/canvas-flow.tsx`).
 * Custom rendering for these arrives in a later chapter — for now they carry
 * the base React Flow node/edge shape plus `CanvasNodeData`.
 */
type CanvasNode = Node<CanvasNodeData, "canvasNode">
type CanvasEdge = Edge<Record<string, never>, "canvasEdge">

export { DEFAULT_NODE_COLOR, DEFAULT_NODE_SHAPE, NODE_COLORS, NODE_SHAPES }
export type { CanvasEdge, CanvasNode, CanvasNodeData, NodeColorId, NodeShapeId }

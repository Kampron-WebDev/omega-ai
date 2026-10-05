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

/**
 * The edge stroke and arrowhead color, per `context/ui-context.md`'s edge
 * style. A raw hex for the same reason as `NODE_COLORS`: the arrowhead marker
 * is persisted into Liveblocks Storage with each edge, so it has to be a
 * concrete color rather than a CSS token.
 */
const EDGE_COLOR = "#f8fafc"

const DEFAULT_NODE_COLOR: NodeColorId = "neutral"
const DEFAULT_NODE_SHAPE: NodeShapeId = "rectangle"

interface CanvasNodeSize {
  width: number
  height: number
}

/** Default dimensions used by both the shape panel payload and dropped nodes. */
const DEFAULT_NODE_SIZES: Record<NodeShapeId, CanvasNodeSize> = {
  rectangle: { width: 180, height: 96 },
  diamond: { width: 160, height: 160 },
  circle: { width: 128, height: 128 },
  pill: { width: 180, height: 72 },
  cylinder: { width: 160, height: 112 },
  hexagon: { width: 168, height: 112 },
}

/**
 * What a node is, independent of how it is drawn. The AI, the spec generator,
 * and exports read `kind`; shape and color stay free for the user to change.
 * Each kind's defaults are what a new node of that kind looks like.
 */
const NODE_KINDS = [
  { id: "client", label: "Client", defaultShape: "circle", defaultColor: "neutral" },
  { id: "frontend", label: "Frontend", defaultShape: "rectangle", defaultColor: "blue" },
  { id: "gateway", label: "API Gateway", defaultShape: "hexagon", defaultColor: "purple" },
  { id: "load-balancer", label: "Load Balancer", defaultShape: "diamond", defaultColor: "purple" },
  { id: "service", label: "Service", defaultShape: "rectangle", defaultColor: "blue" },
  { id: "worker", label: "Worker", defaultShape: "pill", defaultColor: "teal" },
  { id: "function", label: "Function", defaultShape: "pill", defaultColor: "teal" },
  { id: "database", label: "Database", defaultShape: "cylinder", defaultColor: "green" },
  { id: "cache", label: "Cache", defaultShape: "cylinder", defaultColor: "orange" },
  { id: "queue", label: "Queue / Stream", defaultShape: "pill", defaultColor: "orange" },
  { id: "storage", label: "Object Storage", defaultShape: "cylinder", defaultColor: "neutral" },
  { id: "search", label: "Search", defaultShape: "rectangle", defaultColor: "pink" },
  { id: "auth", label: "Auth / Identity", defaultShape: "hexagon", defaultColor: "red" },
  { id: "external", label: "External System", defaultShape: "hexagon", defaultColor: "neutral" },
  { id: "generic", label: "Generic", defaultShape: "rectangle", defaultColor: "neutral" },
] as const satisfies readonly {
  id: string
  label: string
  defaultShape: NodeShapeId
  defaultColor: NodeColorId
}[]

type NodeKindId = (typeof NODE_KINDS)[number]["id"]

/** The kind of a node dropped from the shape panel, and of any legacy node. */
const DEFAULT_NODE_KIND: NodeKindId = "generic"

/** How one component talks to another. */
const EDGE_PROTOCOLS = [
  "http",
  "grpc",
  "graphql",
  "websocket",
  "event",
  "sql",
  "tcp",
  "other",
] as const

type EdgeProtocolId = (typeof EDGE_PROTOCOLS)[number]

const EDGE_PROTOCOL_LABELS: Record<EdgeProtocolId, string> = {
  http: "HTTP",
  grpc: "gRPC",
  graphql: "GraphQL",
  websocket: "WebSocket",
  event: "Event",
  sql: "SQL",
  tcp: "TCP",
  other: "Other",
}

const EDGE_MODES = ["sync", "async"] as const

type EdgeModeId = (typeof EDGE_MODES)[number]

interface CanvasNodeData extends Record<string, unknown> {
  label: string
  color: NodeColorId
  shape: NodeShapeId
  kind: NodeKindId
  technology?: string
  description?: string
}

interface CanvasEdgeData extends Record<string, unknown> {
  label: string
  protocol?: EdgeProtocolId
  mode?: EdgeModeId
}

/**
 * The canvas's React Flow node and edge types, synced through Liveblocks
 * Storage by `useLiveblocksFlow` and rendered by the custom type registry in
 * `components/editor/canvas-flow.tsx`.
 */
type CanvasNode = Node<CanvasNodeData, "canvasNode">
type CanvasEdge = Edge<CanvasEdgeData, "canvasEdge">

interface CanvasGraph {
  nodes: CanvasNode[]
  edges: CanvasEdge[]
}

export {
  DEFAULT_NODE_COLOR,
  DEFAULT_NODE_KIND,
  DEFAULT_NODE_SHAPE,
  DEFAULT_NODE_SIZES,
  EDGE_COLOR,
  EDGE_MODES,
  EDGE_PROTOCOL_LABELS,
  EDGE_PROTOCOLS,
  NODE_COLORS,
  NODE_KINDS,
  NODE_SHAPES,
}
export type {
  CanvasEdge,
  CanvasEdgeData,
  CanvasGraph,
  CanvasNode,
  CanvasNodeData,
  CanvasNodeSize,
  EdgeModeId,
  EdgeProtocolId,
  NodeColorId,
  NodeKindId,
  NodeShapeId,
}

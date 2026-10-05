import { Position } from "@xyflow/react"

import { NEW_EDGE_OPTIONS } from "@/lib/canvas-edge-options"
import {
  DEFAULT_NODE_COLOR,
  DEFAULT_NODE_SHAPE,
  DEFAULT_NODE_SIZES,
  NODE_KINDS,
  type CanvasEdge,
  type CanvasEdgeData,
  type CanvasNode,
  type CanvasNodeData,
  type EdgeModeId,
  type EdgeProtocolId,
  type NodeColorId,
  type NodeKindId,
  type NodeShapeId,
} from "@/types/canvas"

/**
 * A predefined diagram, stored in the codebase and resolved by `id` — no
 * database record, per `architecture-context.md`. Nodes and edges use the
 * exact schema the canvas persists, so importing one is just writing them.
 */
interface CanvasTemplate {
  id: string
  name: string
  description: string
  nodes: CanvasNode[]
  edges: CanvasEdge[]
}

interface TemplateNodeOptions {
  /** Drawn instead of the kind's default shape. */
  shape?: NodeShapeId
  /** Drawn instead of the kind's default color. */
  color?: NodeColorId
  technology?: string
  description?: string
}

/**
 * A node centred on `(x, y)` at its shape's default size — the same `origin`
 * and dimensions a node dropped from the shape panel gets. Shape and color
 * come from the kind unless the template overrides them.
 */
function templateNode(
  id: string,
  kind: NodeKindId,
  label: string,
  x: number,
  y: number,
  options: TemplateNodeOptions = {}
): CanvasNode {
  const kindDefaults = NODE_KINDS.find((nodeKind) => nodeKind.id === kind)
  const shape = options.shape ?? kindDefaults?.defaultShape ?? DEFAULT_NODE_SHAPE
  const color = options.color ?? kindDefaults?.defaultColor ?? DEFAULT_NODE_COLOR
  const { width, height } = DEFAULT_NODE_SIZES[shape]
  const data: CanvasNodeData = { label, color, shape, kind }

  if (options.technology) {
    data.technology = options.technology
  }

  if (options.description) {
    data.description = options.description
  }

  return {
    id,
    type: "canvasNode",
    position: { x, y },
    origin: [0.5, 0.5],
    width,
    height,
    data,
  }
}

interface TemplateEdgeOptions {
  label?: string
  protocol?: EdgeProtocolId
  mode?: EdgeModeId
}

/**
 * An edge between two node sides, built from the same defaults as a
 * hand-drawn connection. Handle IDs are the node handles' `Position` values.
 */
function templateEdge(
  source: string,
  sourceSide: Position,
  target: string,
  targetSide: Position,
  { label = "", protocol, mode }: TemplateEdgeOptions = {}
): CanvasEdge {
  const data: CanvasEdgeData = { label }

  if (protocol) {
    data.protocol = protocol
  }

  if (mode) {
    data.mode = mode
  }

  return {
    ...NEW_EDGE_OPTIONS,
    id: `${source}-${sourceSide}-${target}-${targetSide}`,
    source,
    sourceHandle: sourceSide,
    target,
    targetHandle: targetSide,
    data,
  }
}

const { Top, Right, Bottom, Left } = Position

const HTTP: TemplateEdgeOptions = { protocol: "http", mode: "sync" }
const SQL: TemplateEdgeOptions = { protocol: "sql", mode: "sync" }
const EVENT: TemplateEdgeOptions = { protocol: "event", mode: "async" }
const POSTGRES: TemplateNodeOptions = { technology: "PostgreSQL" }

const MICROSERVICES_TEMPLATE: CanvasTemplate = {
  id: "microservices",
  name: "Microservices",
  description:
    "An API gateway routing clients to independent services, each owning its own database.",
  nodes: [
    templateNode("client", "client", "Client", 0, 0),
    templateNode("gateway", "gateway", "API Gateway", 260, 0),
    templateNode("auth", "auth", "Auth Service", 540, -160),
    templateNode("orders", "service", "Order Service", 540, 0),
    templateNode("payments", "service", "Payment Service", 540, 160),
    templateNode("auth-db", "database", "Users DB", 820, -160, POSTGRES),
    templateNode("orders-db", "database", "Orders DB", 820, 0, POSTGRES),
    templateNode("payments-db", "database", "Payments DB", 820, 160, POSTGRES),
  ],
  edges: [
    templateEdge("client", Right, "gateway", Left, HTTP),
    templateEdge("gateway", Right, "auth", Left, HTTP),
    templateEdge("gateway", Right, "orders", Left, HTTP),
    templateEdge("gateway", Right, "payments", Left, HTTP),
    templateEdge("auth", Right, "auth-db", Left, SQL),
    templateEdge("orders", Right, "orders-db", Left, SQL),
    templateEdge("payments", Right, "payments-db", Left, SQL),
    templateEdge("orders", Bottom, "payments", Top, { ...HTTP, label: "charge" }),
  ],
}

// Pipeline stages are steps, not components, so they stay generic and keep
// the shapes and colors that tell the stages apart.
const CI_CD_TEMPLATE: CanvasTemplate = {
  id: "ci-cd-pipeline",
  name: "CI/CD Pipeline",
  description:
    "A commit flowing through build, test, and a quality gate before staged deployment.",
  nodes: [
    templateNode("commit", "generic", "Commit", 0, 0, { shape: "circle" }),
    templateNode("build", "generic", "Build", 250, 0, { color: "blue" }),
    templateNode("test", "generic", "Test", 510, 0, { color: "purple" }),
    templateNode("gate", "generic", "Quality Gate", 770, 0, {
      shape: "diamond",
      color: "orange",
    }),
    templateNode("staging", "generic", "Deploy Staging", 1030, 0, {
      shape: "pill",
      color: "teal",
    }),
    templateNode("production", "generic", "Deploy Production", 1290, 0, {
      shape: "pill",
      color: "green",
    }),
    templateNode("notify", "generic", "Notify Team", 770, 220, { color: "red" }),
  ],
  edges: [
    templateEdge("commit", Right, "build", Left),
    templateEdge("build", Right, "test", Left),
    templateEdge("test", Right, "gate", Left),
    templateEdge("gate", Right, "staging", Left, { label: "pass" }),
    templateEdge("gate", Bottom, "notify", Top, { label: "fail" }),
    templateEdge("staging", Right, "production", Left, { label: "approve" }),
  ],
}

const EVENT_DRIVEN_TEMPLATE: CanvasTemplate = {
  id: "event-driven",
  name: "Event-Driven System",
  description:
    "Producers publish to an event bus that fans out to independent consumers.",
  nodes: [
    templateNode("web", "frontend", "Web App", 0, -90),
    templateNode("mobile", "frontend", "Mobile App", 0, 90),
    templateNode("api", "service", "API", 260, 0),
    templateNode("bus", "queue", "Event Bus", 520, 0),
    templateNode("email", "service", "Email Service", 800, -160),
    templateNode("inventory", "service", "Inventory Service", 800, 0),
    templateNode("analytics", "service", "Analytics Service", 800, 160),
    templateNode("warehouse", "database", "Data Warehouse", 1070, 160),
  ],
  edges: [
    templateEdge("web", Right, "api", Left, HTTP),
    templateEdge("mobile", Right, "api", Left, HTTP),
    templateEdge("api", Right, "bus", Left, { ...EVENT, label: "publish" }),
    templateEdge("bus", Right, "email", Left, EVENT),
    templateEdge("bus", Right, "inventory", Left, EVENT),
    templateEdge("bus", Right, "analytics", Left, EVENT),
    templateEdge("analytics", Right, "warehouse", Left, SQL),
  ],
}

const CANVAS_TEMPLATES: CanvasTemplate[] = [
  MICROSERVICES_TEMPLATE,
  CI_CD_TEMPLATE,
  EVENT_DRIVEN_TEMPLATE,
]

export { CANVAS_TEMPLATES }
export type { CanvasTemplate }

import { Position } from "@xyflow/react"

import { NEW_EDGE_OPTIONS } from "@/lib/canvas-edge-options"
import {
  DEFAULT_NODE_SIZES,
  type CanvasEdge,
  type CanvasNode,
  type NodeColorId,
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

/**
 * A node centred on `(x, y)` at its shape's default size — the same `origin`
 * and dimensions a node dropped from the shape panel gets.
 */
function templateNode(
  id: string,
  shape: NodeShapeId,
  label: string,
  color: NodeColorId,
  x: number,
  y: number
): CanvasNode {
  const { width, height } = DEFAULT_NODE_SIZES[shape]

  return {
    id,
    type: "canvasNode",
    position: { x, y },
    origin: [0.5, 0.5],
    width,
    height,
    data: { label, color, shape },
  }
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
  label = ""
): CanvasEdge {
  return {
    ...NEW_EDGE_OPTIONS,
    id: `${source}-${sourceSide}-${target}-${targetSide}`,
    source,
    sourceHandle: sourceSide,
    target,
    targetHandle: targetSide,
    data: { label },
  }
}

const { Top, Right, Bottom, Left } = Position

const MICROSERVICES_TEMPLATE: CanvasTemplate = {
  id: "microservices",
  name: "Microservices",
  description:
    "An API gateway routing clients to independent services, each owning its own database.",
  nodes: [
    templateNode("client", "circle", "Client", "neutral", 0, 0),
    templateNode("gateway", "hexagon", "API Gateway", "blue", 260, 0),
    templateNode("auth", "pill", "Auth Service", "purple", 540, -160),
    templateNode("orders", "pill", "Order Service", "green", 540, 0),
    templateNode("payments", "pill", "Payment Service", "orange", 540, 160),
    templateNode("auth-db", "cylinder", "Users DB", "neutral", 820, -160),
    templateNode("orders-db", "cylinder", "Orders DB", "neutral", 820, 0),
    templateNode("payments-db", "cylinder", "Payments DB", "neutral", 820, 160),
  ],
  edges: [
    templateEdge("client", Right, "gateway", Left, "HTTPS"),
    templateEdge("gateway", Right, "auth", Left),
    templateEdge("gateway", Right, "orders", Left),
    templateEdge("gateway", Right, "payments", Left),
    templateEdge("auth", Right, "auth-db", Left),
    templateEdge("orders", Right, "orders-db", Left),
    templateEdge("payments", Right, "payments-db", Left),
    templateEdge("orders", Bottom, "payments", Top, "charge"),
  ],
}

const CI_CD_TEMPLATE: CanvasTemplate = {
  id: "ci-cd-pipeline",
  name: "CI/CD Pipeline",
  description:
    "A commit flowing through build, test, and a quality gate before staged deployment.",
  nodes: [
    templateNode("commit", "circle", "Commit", "neutral", 0, 0),
    templateNode("build", "rectangle", "Build", "blue", 250, 0),
    templateNode("test", "rectangle", "Test", "purple", 510, 0),
    templateNode("gate", "diamond", "Quality Gate", "orange", 770, 0),
    templateNode("staging", "pill", "Deploy Staging", "teal", 1030, 0),
    templateNode("production", "pill", "Deploy Production", "green", 1290, 0),
    templateNode("notify", "rectangle", "Notify Team", "red", 770, 220),
  ],
  edges: [
    templateEdge("commit", Right, "build", Left),
    templateEdge("build", Right, "test", Left),
    templateEdge("test", Right, "gate", Left),
    templateEdge("gate", Right, "staging", Left, "pass"),
    templateEdge("gate", Bottom, "notify", Top, "fail"),
    templateEdge("staging", Right, "production", Left, "approve"),
  ],
}

const EVENT_DRIVEN_TEMPLATE: CanvasTemplate = {
  id: "event-driven",
  name: "Event-Driven System",
  description:
    "Producers publish to an event bus that fans out to independent consumers.",
  nodes: [
    templateNode("web", "rectangle", "Web App", "neutral", 0, -90),
    templateNode("mobile", "rectangle", "Mobile App", "neutral", 0, 90),
    templateNode("api", "pill", "API", "blue", 260, 0),
    templateNode("bus", "hexagon", "Event Bus", "purple", 520, 0),
    templateNode("email", "pill", "Email Service", "pink", 800, -160),
    templateNode("inventory", "pill", "Inventory Service", "green", 800, 0),
    templateNode("analytics", "pill", "Analytics Service", "teal", 800, 160),
    templateNode("warehouse", "cylinder", "Data Warehouse", "neutral", 1070, 160),
  ],
  edges: [
    templateEdge("web", Right, "api", Left),
    templateEdge("mobile", Right, "api", Left),
    templateEdge("api", Right, "bus", Left, "publish"),
    templateEdge("bus", Right, "email", Left),
    templateEdge("bus", Right, "inventory", Left),
    templateEdge("bus", Right, "analytics", Left),
    templateEdge("analytics", Right, "warehouse", Left),
  ],
}

const CANVAS_TEMPLATES: CanvasTemplate[] = [
  MICROSERVICES_TEMPLATE,
  CI_CD_TEMPLATE,
  EVENT_DRIVEN_TEMPLATE,
]

export { CANVAS_TEMPLATES }
export type { CanvasTemplate }

import { MarkerType } from "@xyflow/react"
import { z } from "zod"

import {
  DEFAULT_NODE_KIND,
  EDGE_MODES,
  EDGE_PROTOCOLS,
  NODE_COLORS,
  NODE_KINDS,
  NODE_SHAPES,
  type CanvasGraph,
  type CanvasNode,
  type NodeColorId,
  type NodeKindId,
} from "@/types/canvas"

/**
 * The single validator for every graph that crosses a boundary: templates,
 * snapshots, checkpoints, imports, and AI output. The schemas are built from
 * the constants in `types/canvas.ts`, so a new shape, color, kind, or protocol
 * is accepted here the moment it is added there.
 */

/** Boundary limits. Typing on the canvas is not truncated to these. */
const CANVAS_LIMITS = {
  maxNodes: 300,
  maxEdges: 600,
  maxLabel: 120,
  maxTechnology: 60,
  maxDescription: 1000,
  maxEdgeLabel: 80,
} as const

/** How many issues `parseCanvasGraph` reports before summarizing the rest. */
const MAX_REPORTED_ISSUES = 25
const MAX_QUOTED_VALUE_LENGTH = 40

const NODE_COLOR_IDS = NODE_COLORS.map(({ id }) => id) as [
  NodeColorId,
  ...NodeColorId[],
]
const NODE_KIND_IDS = NODE_KINDS.map(({ id }) => id) as [
  NodeKindId,
  ...NodeKindId[],
]

/** Quotes a rejected value for an issue message, without echoing it at length. */
function quote(value: unknown): string {
  const text = typeof value === "string" ? value : JSON.stringify(value) ?? "undefined"

  return text.length > MAX_QUOTED_VALUE_LENGTH
    ? `"${text.slice(0, MAX_QUOTED_VALUE_LENGTH)}…"`
    : `"${text}"`
}

function tooLong(limit: number): string {
  return `is longer than ${limit} characters`
}

const idSchema = z.string().min(1, "must not be empty")

const canvasNodeDataSchema = z.object({
  label: z.string().max(CANVAS_LIMITS.maxLabel, tooLong(CANVAS_LIMITS.maxLabel)),
  color: z.enum(NODE_COLOR_IDS, {
    error: (issue) => `is not a known color (${quote(issue.input)})`,
  }),
  shape: z.enum(NODE_SHAPES, {
    error: (issue) => `is not a known shape (${quote(issue.input)})`,
  }),
  // Legacy nodes predate `kind`; they validate as generic.
  kind: z
    .enum(NODE_KIND_IDS, {
      error: (issue) => `is not a known kind (${quote(issue.input)})`,
    })
    .default(DEFAULT_NODE_KIND),
  technology: z
    .string()
    .max(CANVAS_LIMITS.maxTechnology, tooLong(CANVAS_LIMITS.maxTechnology))
    .optional(),
  description: z
    .string()
    .max(CANVAS_LIMITS.maxDescription, tooLong(CANVAS_LIMITS.maxDescription))
    .optional(),
})

/**
 * React Flow's own fields are the ones the canvas writes and Liveblocks syncs,
 * so a parsed node can be written straight back. Local-only fields (`selected`,
 * `dragging`, `measured`) are dropped.
 */
const canvasNodeSchema = z.object({
  id: idSchema,
  type: z.literal("canvasNode"),
  position: z.object({ x: z.number(), y: z.number() }),
  origin: z.tuple([z.number(), z.number()]).optional(),
  width: z.number().positive().optional(),
  height: z.number().positive().optional(),
  data: canvasNodeDataSchema,
})

const canvasEdgeDataSchema = z.object({
  label: z
    .string()
    .max(CANVAS_LIMITS.maxEdgeLabel, tooLong(CANVAS_LIMITS.maxEdgeLabel))
    .default(""),
  protocol: z
    .enum(EDGE_PROTOCOLS, {
      error: (issue) => `is not a known protocol (${quote(issue.input)})`,
    })
    .optional(),
  mode: z
    .enum(EDGE_MODES, {
      error: (issue) => `is not a known mode (${quote(issue.input)})`,
    })
    .optional(),
})

const edgeMarkerSchema = z.union([
  z.string(),
  z.object({
    type: z.enum(MarkerType),
    color: z.string().nullable().optional(),
    width: z.number().optional(),
    height: z.number().optional(),
    markerUnits: z.string().optional(),
    orient: z.string().optional(),
    strokeWidth: z.number().optional(),
  }),
])

const canvasEdgeSchema = z.object({
  id: idSchema,
  type: z.literal("canvasEdge"),
  source: idSchema,
  target: idSchema,
  sourceHandle: z.string().nullable().optional(),
  targetHandle: z.string().nullable().optional(),
  markerStart: edgeMarkerSchema.optional(),
  markerEnd: edgeMarkerSchema.optional(),
  data: canvasEdgeDataSchema.default({ label: "" }),
})

const canvasGraphSchema = z
  .object({
    nodes: z
      .array(canvasNodeSchema)
      .max(
        CANVAS_LIMITS.maxNodes,
        `The graph has more than ${CANVAS_LIMITS.maxNodes} nodes`
      ),
    edges: z
      .array(canvasEdgeSchema)
      .max(
        CANVAS_LIMITS.maxEdges,
        `The graph has more than ${CANVAS_LIMITS.maxEdges} edges`
      ),
  })
  .superRefine(({ nodes, edges }, context) => {
    const nodeIds = new Set<string>()

    for (const { id } of nodes) {
      if (nodeIds.has(id)) {
        context.addIssue({
          code: "custom",
          message: `Node ID ${id} is used more than once`,
        })
      }

      nodeIds.add(id)
    }

    const edgeIds = new Set<string>()

    for (const { id, source, target } of edges) {
      if (edgeIds.has(id)) {
        context.addIssue({
          code: "custom",
          message: `Edge ID ${id} is used more than once`,
        })
      }

      edgeIds.add(id)

      if (!nodeIds.has(source)) {
        context.addIssue({
          code: "custom",
          message: `Edge ${id} starts at missing node ${source}`,
        })
      }

      if (!nodeIds.has(target)) {
        context.addIssue({
          code: "custom",
          message: `Edge ${id} targets missing node ${target}`,
        })
      }
    }
  })

type ParseCanvasGraphResult =
  | { ok: true; graph: CanvasGraph }
  | { ok: false; issues: string[] }

/** Names the node or edge at `nodes[index]` / `edges[index]` by its own ID. */
function describeItem(input: unknown, list: "nodes" | "edges", index: number): string {
  const noun = list === "nodes" ? "Node" : "Edge"
  const items =
    typeof input === "object" && input !== null
      ? (input as Record<string, unknown>)[list]
      : undefined
  const item: unknown = Array.isArray(items) ? items[index] : undefined
  const id =
    typeof item === "object" && item !== null
      ? (item as Record<string, unknown>).id
      : undefined

  return typeof id === "string" && id.length > 0
    ? `${noun} ${id.slice(0, MAX_QUOTED_VALUE_LENGTH)}`
    : `${noun} #${index + 1}`
}

function describeIssue(input: unknown, issue: z.core.$ZodIssue): string {
  const [list, index, ...field] = issue.path

  if ((list === "nodes" || list === "edges") && typeof index === "number") {
    const subject = describeItem(input, list, index)

    return field.length > 0
      ? `${subject}: ${field.join(".")} ${issue.message}`
      : `${subject}: ${issue.message}`
  }

  // Graph-level refinements and size limits already read as full sentences.
  if (issue.code === "custom" || issue.code === "too_big") {
    return issue.message
  }

  return issue.path.length > 0
    ? `${issue.path.join(".")}: ${issue.message}`
    : `Graph: ${issue.message}`
}

/**
 * Validates an untrusted graph. On success the graph is safe to write to the
 * canvas as is: unknown fields are stripped and legacy nodes carry a kind.
 */
function parseCanvasGraph(input: unknown): ParseCanvasGraphResult {
  const result = canvasGraphSchema.safeParse(input)

  if (result.success) {
    return { ok: true, graph: result.data }
  }

  const issues = result.error.issues
    .slice(0, MAX_REPORTED_ISSUES)
    .map((issue) => describeIssue(input, issue))
  const hidden = result.error.issues.length - issues.length

  if (hidden > 0) {
    issues.push(`…and ${hidden} more`)
  }

  return { ok: false, issues }
}

function isNodeKindId(value: unknown): value is NodeKindId {
  return (
    typeof value === "string" &&
    (NODE_KIND_IDS as readonly string[]).includes(value)
  )
}

/**
 * The kind to treat a stored value as. A missing kind (a node from before
 * kinds existed) or an unknown one (an older or newer client) reads as
 * generic, so the canvas never crashes on what a room happens to hold.
 */
function resolveNodeKind(value: unknown): NodeKindId {
  return isNodeKindId(value) ? value : DEFAULT_NODE_KIND
}

/**
 * Every reader of a stored graph goes through this instead of trusting
 * `data.kind`. Rooms are never migrated in place; a node that already has a
 * known kind is returned as the same object.
 */
function normalizeCanvasNode(node: CanvasNode): CanvasNode {
  const kind: unknown = node.data.kind

  return isNodeKindId(kind)
    ? node
    : { ...node, data: { ...node.data, kind: DEFAULT_NODE_KIND } }
}

export {
  CANVAS_LIMITS,
  canvasEdgeSchema,
  canvasGraphSchema,
  canvasNodeSchema,
  normalizeCanvasNode,
  parseCanvasGraph,
  resolveNodeKind,
}
export type { ParseCanvasGraphResult }

import { describe, expect, it } from "vitest"

import { CANVAS_TEMPLATES } from "@/components/editor/starter-templates"
import {
  CANVAS_LIMITS,
  normalizeCanvasNode,
  parseCanvasGraph,
  resolveNodeKind,
} from "@/lib/canvas-schema"
import {
  NODE_COLORS,
  NODE_KINDS,
  NODE_SHAPES,
  type CanvasNode,
} from "@/types/canvas"

function node(id: string, data: Record<string, unknown> = {}) {
  return {
    id,
    type: "canvasNode",
    position: { x: 0, y: 0 },
    origin: [0.5, 0.5],
    width: 180,
    height: 96,
    data: {
      label: id,
      color: "neutral",
      shape: "rectangle",
      kind: "service",
      ...data,
    },
  }
}

function edge(id: string, source: string, target: string, data?: Record<string, unknown>) {
  return { id, type: "canvasEdge", source, target, data: { label: "", ...data } }
}

function issuesOf(input: unknown): string[] {
  const result = parseCanvasGraph(input)

  if (result.ok) {
    throw new Error("Expected the graph to be rejected")
  }

  return result.issues
}

describe("NODE_KINDS", () => {
  it("defaults only reference existing shapes and colors", () => {
    const colorIds: readonly string[] = NODE_COLORS.map(({ id }) => id)
    const shapeIds: readonly string[] = NODE_SHAPES

    for (const kind of NODE_KINDS) {
      expect(shapeIds, kind.id).toContain(kind.defaultShape)
      expect(colorIds, kind.id).toContain(kind.defaultColor)
    }
  })

  it("has unique IDs and includes the generic fallback", () => {
    const ids = NODE_KINDS.map(({ id }) => id)

    expect(new Set(ids).size).toBe(ids.length)
    expect(ids).toContain("generic")
  })
})

describe("starter templates", () => {
  it.each(CANVAS_TEMPLATES)("$name passes parseCanvasGraph unchanged", (template) => {
    const graph = { nodes: template.nodes, edges: template.edges }
    const result = parseCanvasGraph(graph)

    expect(result).toEqual({ ok: true, graph })
  })

  it.each(CANVAS_TEMPLATES)("$name gives every node a known kind", (template) => {
    for (const templateNode of template.nodes) {
      expect(resolveNodeKind(templateNode.data.kind)).toBe(templateNode.data.kind)
    }
  })
})

describe("parseCanvasGraph", () => {
  it("accepts an empty graph", () => {
    expect(parseCanvasGraph({ nodes: [], edges: [] })).toEqual({
      ok: true,
      graph: { nodes: [], edges: [] },
    })
  })

  it("accepts metadata on nodes and edges", () => {
    const graph = {
      nodes: [
        node("api", { technology: "Node.js", description: "Public API" }),
        node("db", { kind: "database", shape: "cylinder" }),
      ],
      edges: [edge("e1", "api", "db", { label: "read", protocol: "sql", mode: "sync" })],
    }

    expect(parseCanvasGraph(graph)).toEqual({ ok: true, graph })
  })

  it("fills generic for a legacy node without a kind", () => {
    const legacy = node("old")
    delete (legacy.data as Record<string, unknown>).kind

    const result = parseCanvasGraph({ nodes: [legacy], edges: [] })

    expect(result.ok && result.graph.nodes[0].data.kind).toBe("generic")
  })

  it("fills an empty label for an edge stored without data", () => {
    const result = parseCanvasGraph({
      nodes: [node("a"), node("b")],
      edges: [{ id: "e1", type: "canvasEdge", source: "a", target: "b" }],
    })

    expect(result.ok && result.graph.edges[0].data).toEqual({ label: "" })
  })

  it("keeps React Flow's fields and drops local-only and unknown ones", () => {
    const result = parseCanvasGraph({
      nodes: [{ ...node("a"), selected: true, measured: { width: 1, height: 1 } }],
      edges: [],
      extra: true,
    })

    expect(result).toEqual({ ok: true, graph: { nodes: [node("a")], edges: [] } })
  })

  it("rejects a duplicate node ID", () => {
    expect(issuesOf({ nodes: [node("a"), node("a")], edges: [] })).toEqual([
      "Node ID a is used more than once",
    ])
  })

  it("rejects a duplicate edge ID", () => {
    expect(
      issuesOf({
        nodes: [node("a"), node("b")],
        edges: [edge("e1", "a", "b"), edge("e1", "b", "a")],
      })
    ).toEqual(["Edge ID e1 is used more than once"])
  })

  it("rejects a dangling edge, naming the missing node", () => {
    expect(
      issuesOf({ nodes: [node("api")], edges: [edge("e3", "api", "db-2")] })
    ).toEqual(["Edge e3 targets missing node db-2"])

    expect(
      issuesOf({ nodes: [node("api")], edges: [edge("e4", "gone", "api")] })
    ).toEqual(["Edge e4 starts at missing node gone"])
  })

  it("rejects an unknown shape", () => {
    expect(issuesOf({ nodes: [node("a", { shape: "star" })], edges: [] })).toEqual([
      'Node a: data.shape is not a known shape ("star")',
    ])
  })

  it("rejects an unknown kind", () => {
    expect(issuesOf({ nodes: [node("a", { kind: "lambda" })], edges: [] })).toEqual([
      'Node a: data.kind is not a known kind ("lambda")',
    ])
  })

  it("rejects an unknown color, protocol, and mode", () => {
    expect(
      issuesOf({
        nodes: [node("a", { color: "gold" }), node("b")],
        edges: [edge("e1", "a", "b", { protocol: "smtp", mode: "batch" })],
      })
    ).toEqual([
      'Node a: data.color is not a known color ("gold")',
      'Edge e1: data.protocol is not a known protocol ("smtp")',
      'Edge e1: data.mode is not a known mode ("batch")',
    ])
  })

  it("rejects text over its limit and accepts text at it", () => {
    const atLimit = {
      nodes: [
        node("a", {
          label: "x".repeat(CANVAS_LIMITS.maxLabel),
          technology: "x".repeat(CANVAS_LIMITS.maxTechnology),
          description: "x".repeat(CANVAS_LIMITS.maxDescription),
        }),
      ],
      edges: [edge("e1", "a", "a", { label: "x".repeat(CANVAS_LIMITS.maxEdgeLabel) })],
    }

    expect(parseCanvasGraph(atLimit).ok).toBe(true)

    expect(
      issuesOf({
        nodes: [
          node("a", {
            label: "x".repeat(CANVAS_LIMITS.maxLabel + 1),
            technology: "x".repeat(CANVAS_LIMITS.maxTechnology + 1),
            description: "x".repeat(CANVAS_LIMITS.maxDescription + 1),
          }),
        ],
        edges: [
          edge("e1", "a", "a", { label: "x".repeat(CANVAS_LIMITS.maxEdgeLabel + 1) }),
        ],
      })
    ).toEqual([
      "Node a: data.label is longer than 120 characters",
      "Node a: data.technology is longer than 60 characters",
      "Node a: data.description is longer than 1000 characters",
      "Edge e1: data.label is longer than 80 characters",
    ])
  })

  it("rejects more than maxNodes nodes and accepts exactly maxNodes", () => {
    const nodes = Array.from({ length: CANVAS_LIMITS.maxNodes + 1 }, (_, index) =>
      node(`n${index}`)
    )

    expect(parseCanvasGraph({ nodes: nodes.slice(1), edges: [] }).ok).toBe(true)
    expect(issuesOf({ nodes, edges: [] })).toEqual([
      "The graph has more than 300 nodes",
    ])
  })

  it("rejects more than maxEdges edges", () => {
    const edges = Array.from({ length: CANVAS_LIMITS.maxEdges + 1 }, (_, index) =>
      edge(`e${index}`, "a", "a")
    )

    expect(issuesOf({ nodes: [node("a")], edges })).toEqual([
      "The graph has more than 600 edges",
    ])
  })

  it("names a node without a usable ID by its position", () => {
    const [issue] = issuesOf({ nodes: [node("a"), { ...node("b"), id: 7 }], edges: [] })

    expect(issue).toMatch(/^Node #2: id /)
  })

  it("rejects non-finite coordinates and a wrong node type", () => {
    const issues = issuesOf({
      nodes: [{ ...node("a"), type: "group", position: { x: Number.NaN, y: 0 } }],
      edges: [],
    })

    expect(issues).toHaveLength(2)
    expect(issues[0]).toMatch(/^Node a: type /)
    expect(issues[1]).toMatch(/^Node a: position\.x /)
  })

  it.each([null, undefined, "graph", 42, [], {}, { nodes: [] }, { nodes: {}, edges: [] }])(
    "rejects %j without throwing",
    (input) => {
      const result = parseCanvasGraph(input)

      expect(result.ok).toBe(false)
      expect(issuesOf(input).length).toBeGreaterThan(0)
    }
  )

  it("summarizes the issues past the reporting cap", () => {
    const nodes = Array.from({ length: 40 }, (_, index) =>
      node(`n${index}`, { shape: "star" })
    )
    const issues = issuesOf({ nodes, edges: [] })

    expect(issues).toHaveLength(26)
    expect(issues.at(-1)).toBe("…and 15 more")
  })

  it("does not echo a long rejected value in full", () => {
    const [issue] = issuesOf({
      nodes: [node("a", { kind: "k".repeat(500) })],
      edges: [],
    })

    expect(issue.length).toBeLessThan(120)
  })
})

describe("normalizeCanvasNode", () => {
  const valid = node("a") as CanvasNode

  it("returns a node with a known kind untouched", () => {
    expect(normalizeCanvasNode(valid)).toBe(valid)
  })

  it("fills generic for a legacy node without a kind", () => {
    const legacyData: Record<string, unknown> = { ...valid.data }
    delete legacyData.kind
    const legacy = { ...valid, data: legacyData } as unknown as CanvasNode

    expect(normalizeCanvasNode(legacy)).toEqual({
      ...valid,
      data: { ...valid.data, kind: "generic" },
    })
    expect(legacy.data.kind).toBeUndefined()
  })

  it("reads an unknown kind as generic", () => {
    const unknown = {
      ...valid,
      data: { ...valid.data, kind: "lambda" },
    } as unknown as CanvasNode

    expect(normalizeCanvasNode(unknown).data.kind).toBe("generic")
  })
})

describe("resolveNodeKind", () => {
  it("keeps known kinds and falls back to generic otherwise", () => {
    expect(resolveNodeKind("database")).toBe("database")
    expect(resolveNodeKind("lambda")).toBe("generic")
    expect(resolveNodeKind(undefined)).toBe("generic")
    expect(resolveNodeKind(3)).toBe("generic")
  })
})

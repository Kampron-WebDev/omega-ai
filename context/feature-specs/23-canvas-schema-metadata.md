# 23 — Canvas Schema and Semantic Metadata

**Phase:** 4 · Canvas durability · **Depends on:** 21 · **Unlocks:** 24, 25, 33, 35, 38, 41

## Goal

Give the canvas meaning, not just pictures. Today a node is a label, a shape, and a color, so a database and a web app differ only in how they look. The AI and the spec generator cannot tell them apart. This unit adds a semantic **kind** (service, database, queue, and so on), an optional **technology** and **description** to nodes, and a **protocol** and **sync/async mode** to edges. It also creates the one validator that every graph crossing a boundary goes through.

## Read first

- `types/canvas.ts`: the existing constants and types, which stay the source of truth for shapes and colors
- `components/editor/starter-templates.ts`: every template is migrated in this unit
- `components/editor/canvas-node.tsx`, `canvas-node-shape.tsx`, and `canvas-edge.tsx`: the renderers that display the new fields
- The Liveblocks entry in Architecture Decisions: node and edge `data` sync as nested `LiveObject`s, so new optional data fields need no storage migration

## Implementation

1. **Node kinds.** In `types/canvas.ts`, add `NODE_KINDS`, each with an `id`, a `label`, a `defaultShape`, and a `defaultColor`:

   | id | label | shape | color |
   | --- | --- | --- | --- |
   | `client` | Client | circle | neutral |
   | `frontend` | Frontend | rectangle | blue |
   | `gateway` | API Gateway | hexagon | purple |
   | `load-balancer` | Load Balancer | diamond | purple |
   | `service` | Service | rectangle | blue |
   | `worker` | Worker | pill | teal |
   | `function` | Function | pill | teal |
   | `database` | Database | cylinder | green |
   | `cache` | Cache | cylinder | orange |
   | `queue` | Queue / Stream | pill | orange |
   | `storage` | Object Storage | cylinder | neutral |
   | `search` | Search | rectangle | pink |
   | `auth` | Auth / Identity | hexagon | red |
   | `external` | External System | hexagon | neutral |
   | `generic` | Generic | rectangle | neutral |

   Export `NodeKindId` and `DEFAULT_NODE_KIND = "generic"`.

2. **Data shapes.**
   - `CanvasNodeData` gains `kind: NodeKindId`, plus optional `technology?: string` and `description?: string`.
   - `CanvasEdgeData` gains `protocol?: EdgeProtocolId` and `mode?: "sync" | "async"`.
   - Add `EDGE_PROTOCOLS`: `http`, `grpc`, `graphql`, `websocket`, `event`, `sql`, `tcp`, `other`.

3. **The validator: `lib/canvas-schema.ts`.**
   - zod schemas `canvasNodeSchema`, `canvasEdgeSchema`, and `canvasGraphSchema` (`{ nodes, edges }`), built from the constants above, so a new shape or kind cannot drift between the two files.
   - `CANVAS_LIMITS`:

     | Limit | Value |
     | --- | --- |
     | `maxNodes` | 300 |
     | `maxEdges` | 600 |
     | `maxLabel` | 120 |
     | `maxTechnology` | 60 |
     | `maxDescription` | 1000 |
     | `maxEdgeLabel` | 80 |

   - Graph-level refinements: unique node IDs, unique edge IDs, and every edge's `source` and `target` exist among the nodes.
   - `parseCanvasGraph(input: unknown)` returns a discriminated result `{ ok: true, graph } | { ok: false, issues: string[] }`. Issues are readable ("Edge e3 targets missing node db-2").
   - `normalizeCanvasNode(node)` fills `kind: "generic"` for legacy nodes that lack it. Every reader of stored graphs (renderer, snapshot, AI context) goes through normalization. Existing rooms are never migrated in place.
   - Keep React Flow's own fields (`position`, `width`, `height`, `origin`, handles, `type`) in the schema, so a parsed graph can be written straight back.

4. **Templates.** Give every template node the right `kind`, a `technology` where the template implies one (for example "PostgreSQL"), and edges a `protocol` and `mode` where obvious. Template helpers take the kind and derive shape and color from `NODE_KINDS` unless overridden.

5. **Rendering.**
   - The node shows a small kind icon (Lucide, stroke only) before the label, and the technology as a muted second line when set. Put the icon mapping in `components/editor/node-kind-icon.tsx`; it is UI, so it stays out of `types/`.
   - Async edges render dashed. The protocol, when set, appears as a small muted prefix in the edge label ("HTTP · Place order").
   - Nothing changes for nodes without the new fields, beyond the generic icon.

6. **Creation paths.** Nodes dropped from the shape panel get `kind: "generic"`. The shape panel itself is unchanged.

## Contracts

```ts
type NodeKindId = (typeof NODE_KINDS)[number]["id"]
type EdgeProtocolId = (typeof EDGE_PROTOCOLS)[number]

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
  mode?: "sync" | "async"
}

type CanvasGraph = { nodes: CanvasNode[]; edges: CanvasEdge[] }
type ParseCanvasGraphResult =
  | { ok: true; graph: CanvasGraph }
  | { ok: false; issues: string[] }
```

## Scope limits

- No editing UI for the new fields. That is spec 24.
- No change to how nodes are created, moved, or connected.
- Do not bump the Liveblocks storage layout or rewrite existing rooms.

## Edge cases

- A legacy node without `kind` renders and validates as `generic`.
- An unknown `kind` string from an old client or a bad import is rejected by `parseCanvasGraph` but rendered as `generic`, so the canvas never crashes.
- Label length limits apply to validation at boundaries only. Typing on the canvas is not truncated mid-keystroke.

## Tests

- Every starter template passes `parseCanvasGraph`. This test fails whenever someone breaks a template.
- Rejections: duplicate node ID, dangling edge, unknown shape, unknown kind, label over the limit, more than `maxNodes` nodes.
- `normalizeCanvasNode` fills `generic` and leaves valid nodes untouched.
- `NODE_KINDS` defaults only reference existing shapes and colors.

## Check when done

- [ ] `NODE_KINDS`, `EDGE_PROTOCOLS`, and the new data fields exist in `types/canvas.ts`.
- [ ] `lib/canvas-schema.ts` is the only graph validator in the codebase.
- [ ] Templates carry kinds and technologies and pass validation in a test.
- [ ] Nodes show a kind icon and technology; async edges are dashed.
- [ ] Legacy rooms still open with no errors.
- [ ] Definition of done in `context/feature-specs/README.md`.

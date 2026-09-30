# 35 — Spec Generation Flow

**Phase:** 6 · Specification · **Depends on:** 28, 31, 33, 34 · **Unlocks:** 36, 39

## Goal

Turn the current design into a Markdown technical specification that a team, or a coding agent, can build from. Everything that can be exact is **computed from the graph, not written by the model**: the architecture diagram (Mermaid), the component inventory, and the connection table. The model writes the reasoning around them: the overview, per-component responsibilities, data flows, non-functional requirements, risks, and open questions.

## Read first

- `lib/canvas-room.ts`, `lib/project-brief.ts`, `lib/ai/model.ts`, `lib/ai/limits.ts`, `lib/trigger-runs.ts`, `trigger/design-agent.ts`: follow its structure
- `types/tasks.ts` (`AiTaskKind` already includes `"spec"`)

## Generation input contract

Create `lib/generation-inputs.ts` and a `GenerationInput` metadata model before generating artifacts. Capture immutable private content containing graph, brief, canonical chat IDs/content and optional source artifact IDs, with schema version and canonical hash. Capture graph/brief consistently using the collaboration API; record a revision vector and retry boundedly on change. The resulting `generationInputId` is carried by the spec, review, plan and export. Spec 50 extends this into full project baselines.

Never combine a graph from one input with a spec generated from another without an explicit stale-input rejection or regeneration. Provider/model/prompt version and truncation/completeness status are artifact metadata. A generated Markdown file with a missing component stub or omitted mandatory context is draft, never build-ready.

## Implementation

1. **Mermaid serializer: `lib/canvas-mermaid.ts`** (pure; reused by spec 41's export).
   - `graphToMermaid(graph)` → a `flowchart LR` string.
   - Node IDs are sanitized to `n1`, `n2`, … (stable by sorted original ID).
   - Labels are escaped: quotes, brackets, pipes, and newlines, wrapped in `"…"`.
   - Shapes map as:

     | Canvas shape | Mermaid shape |
     | --- | --- |
     | rectangle | `[ ]` |
     | pill | `([ ])` |
     | circle | `(( ))` |
     | diamond | `{ }` |
     | hexagon | `{{ }}` |
     | cylinder | `[( )]` |

   - Async edges use `-.->`, sync edges `-->`. The edge label combines protocol and label.
   - Nodes of the same kind are grouped with `classDef` per kind (no colors that break Mermaid themes).

2. **Deterministic sections: `lib/spec/graph-sections.ts`** (pure).
   - `componentInventory(graph)` → a Markdown table: Component, Kind, Technology, Description, Inbound, Outbound.
   - `connectionTable(graph)` → From, To, Protocol, Mode, Purpose (the label).
   - Nodes sort by kind order in `NODE_KINDS`, then by label. The output is stable across runs.

3. **Generated sections: `lib/ai/prompts/spec.ts`.**
   - Structured output (zod), one field per section, each Markdown:
     - `overview`
     - `goalsAndScope`
     - `architecture` (prose explaining the diagram)
     - `components`: an array of `{ nodeId, responsibilities, interfaces, dataOwned, scaling }` for every node
     - `dataFlows`: the three to five key flows, as numbered steps
     - `dataModel` (the main entities per database node)
     - `apis` (the main endpoints per service or gateway)
     - `nonFunctional`: scalability, availability, security, observability, cost
     - `deployment`
     - `risks`
     - `openQuestions`
   - Context: the brief, the graph (same compact JSON as spec 33), the last 20 chat messages, and an optional `focus` from the user. All of it is fenced with `wrapUntrusted`.
   - The prompt tells the model to describe **only** components that exist on the canvas, and to put anything it believes is missing under Risks / Open Questions, not to invent components.

4. **Assembly: `lib/spec/assemble-spec.ts`** (pure).
   - `assembleSpec({ projectName, graph, brief, sections, generatedAt, generatedBy })` → Markdown in a fixed outline:

     ```text
     # {Project} — Technical Specification
     > Generated {date} by Ghost AI for {name} · {n} components · {m} connections
     1. Overview
     2. Goals and Scope          (brief goals / non-goals + model text)
     3. Architecture             (mermaid block + model prose)
     4. Components               (inventory table, then one subsection per node)
     5. Connections              (connection table)
     6. Key Data Flows
     7. Data Model
     8. APIs
     9. Non-Functional Requirements
     10. Deployment
     11. Risks
     12. Open Questions          (brief open questions + model)
     ```

   - A component subsection whose `nodeId` is not in the graph is dropped. A node the model skipped gets a stub subsection that says "Not described", so every node always appears.

5. **Task: `trigger/generate-spec.ts`** (`schemaTask`, id `generate-spec`).
   - Payload: `AiTaskPayload & { focus?: string }`.
   - Flow:
     1. RUNNING; status "Reading the design…"; agent thinking
     2. freeze or resolve the generation input, then read its graph, brief and canonical chat
     3. refuse an empty canvas with a friendly failed status ("Add some components before generating a spec")
     4. generate the sections ("Writing the specification…"), with one repair attempt on schema failure
     5. assemble
     6. status completed; presence cleared; run COMPLETED
   - Persist generated content privately as a draft artifact even before spec 36 adds the full catalog; return IDs/metadata only. Do not expose complete private project content through provider run output or logs. Spec 36 adds the `ProjectSpec` catalog reference.
   - Records usage (spec 34). `maxAttempts: 2`, `maxDuration: 240`.
   - No canvas writes and no checkpoint.

6. **Route: `POST /api/ai/spec`**, body `{ roomId, focus? }` (focus ≤ 1000 characters).
   - Member check, then `startAiRun({ kind: "spec", … })`.
   - **The client sends no nodes, edges, or chat.** The original version of this spec accepted them from the client; they are read server-side instead. Record this under Architecture Decisions.

## Scope limits

- No spec catalog UI (specs 36–37); minimal immutable input/output persistence is required here for consistent downstream artifacts.
- No per-section regeneration.

## Edge cases

- Labels containing Mermaid syntax (`-->`, `[`, `"`) must still produce a diagram that parses. The tests cover this.
- A very large graph: use bounded component batches and an explicit coverage check, or fail with an actionable capacity error. Never silently truncate accepted constraints or declare stubbed/missing components complete. Persist partial results as draft.

## Tests

- `graphToMermaid`: every shape, async edges, escaping, stable IDs. Snapshot-test a starter template's output.
- `componentInventory` and `connectionTable`: ordering and escaping of `|` in cells.
- `assembleSpec`: unknown `nodeId`s dropped; missing nodes stubbed; outline order fixed.
- Route: 401, 404, 409, 202, and a body carrying `nodes` is ignored.

## Check when done

- [ ] `POST /api/ai/spec` starts a run and the room sees its status.
- [ ] The run output is a complete Markdown spec with a valid Mermaid diagram (paste it into a Mermaid renderer to check).
- [ ] The diagram, inventory, and connections match the canvas exactly.
- [ ] Definition of done in `context/feature-specs/README.md`.

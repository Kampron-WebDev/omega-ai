# 38 — Architecture Review

**Phase:** 6 · Specification · **Depends on:** 24, 33, 34, 36 · **Unlocks:** 39, 43

## Goal

Combine deterministic structural checks and explicit architecture heuristics with an AI review of reliability, security, scalability, cost and operability. Heuristics are not proofs: a local database or client SDK may be legitimate. Findings state assumptions and confidence, link to affected elements and feed a review/fix workflow.

## Read first

- `lib/canvas-schema.ts`, `lib/project-specs.ts` (the Blob and metadata pattern to copy), `trigger/generate-spec.ts` (the task structure to copy)
- `components/editor/ai-sidebar.tsx`, `ai-architect-tab.tsx` (the composer draft), and `canvas-flow.tsx` (`CanvasFlowHandle`)

## Implementation

1. **Finding contract** in `types/review.ts` (zod):

   ```ts
   reviewFindingSchema = {
     id: string,                 // stable within a review
     source: "lint" | "ai",
     severity: "critical" | "high" | "medium" | "low" | "info",
     category: "reliability" | "security" | "scalability" | "performance"
             | "data" | "cost" | "operability" | "structure",
     title: string,              // ≤ 120
     detail: string,             // ≤ 1000, Markdown
     recommendation: string,     // ≤ 1000, Markdown, phrased as an instruction
     nodeIds: string[],
     edgeIds: string[],
   }
   ```

2. **Deterministic lint: `lib/architecture-lint.ts`** (pure). Rules, each with an ID and a test:

   | ID | Severity | Rule |
   | --- | --- | --- |
   | `orphan-node` | low | A node with no edges |
   | `unlabeled` | low | A node or edge with an empty label (edges only when async) |
   | `client-to-database` | high | A `client` or `frontend` directly connected to a `database`, `cache`, or `storage` |
   | `shared-database` | medium | A database written by three or more services |
   | `no-entry-point` | medium | Services exist but nothing reaches them from a `client`, `frontend`, `gateway`, or `load-balancer` |
   | `sync-cycle` | medium | A cycle made only of sync edges between services |
   | `single-instance-critical` | info | A gateway or database with no mention of replicas or HA in its description or technology |
   | `untyped-component` | info | Five or more `generic` nodes |

   `lintArchitecture(graph)` returns findings in a deterministic order.

3. **AI review task: `trigger/review-architecture.ts`** (kind `review`, id `review-architecture`).
   - Inputs: one immutable generation input (spec 35), its graph/brief and lint findings. Persist its ID/hash with the review; the model is told not to repeat lint findings. Classify heuristic versus structural findings and allow documented dismissals.
   - Structured output: `{ summary, findings[] }` with `source: "ai"`. Findings referencing unknown IDs have those IDs dropped. A finding left with no valid reference and severity above `info` is kept as project-wide.
   - Merge the lint and AI findings, sort by severity, then category.
   - Persist:
     - Blob `reviews/{projectId}/{random}.json`
     - Prisma `ArchitectureReview { id, projectId, runId @unique, filePath, summary, counts Json, createdById, createdAt }`, with cascade and `@@index([projectId, createdAt])`
   - Chat message: "Review complete: 1 critical, 3 high, …".

4. **Routes** (member):
   - `POST /api/ai/review` with `{ roomId }` → `202 { runId, publicAccessToken }`
   - `GET /api/projects/[projectId]/reviews/latest` → `{ review: { id, summary, counts, createdAt, author, findings } | null }`
   - `GET /api/projects/[projectId]/lint`: runs the deterministic lint on the current room graph, synchronously (no LLM), for instant feedback.

5. **Review tab** in the AI sidebar (between Brief and Specs):
   - "Run review" button (busy, 409, and 429 handling as usual).
   - Severity summary chips. Critical and high use `text-destructive`, and low and info use `text-copy-muted`. Medium uses `text-warning`: add `--color-warning: var(--state-warning)` to `@theme inline` in `globals.css`, because the variable exists but has no utility yet.
   - Findings grouped by severity. Each shows title, category, a `lint` or `AI` badge, the detail (Markdown), and the recommendation.
   - Clicking a finding calls a new `CanvasFlowHandle.focusElements(nodeIds, edgeIds)`: select them and `fitView` to them. The canvas room owns the handle, so the sidebar reaches it through the shell, the same way `importTemplate` does.
   - "Fix with AI" switches to AI Architect and fills the composer with "Address this review finding: {title}. {recommendation}". It does not auto-send.
   - "Stale" badge when current semantic graph/brief hashes differ from the review's generation input. Autosave timestamps alone are insufficient and layout-only changes need not invalidate semantic findings.
   - The lint results show instantly at the top as "Quick checks", even before any AI review exists.

## Scope limits

- Findings are not stored on nodes and no badges are drawn on the canvas (backlog).
- Only the latest review is shown. Older reviews are kept but not listed.

## Edge cases

- An empty canvas: lint returns nothing, and Run review is disabled with a hint.
- A node referenced by a finding has since been deleted: skip it when focusing, and show "(removed)" in the finding.

## Tests

- Each lint rule: a positive and a negative fixture.
- Finding merge: sort order; unknown IDs dropped.
- Routes: access matrix; lint route with the room reader mocked.

## Check when done

- [ ] Quick checks show instantly; the AI review adds findings for everyone.
- [ ] Clicking a finding focuses the canvas; Fix with AI pre-fills the composer.
- [ ] Reviews persist (Blob plus Prisma) and are listed as latest.
- [ ] Definition of done in `context/feature-specs/README.md`.

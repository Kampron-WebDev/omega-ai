# 39 — Build Plan Generation

**Phase:** 6 · Handoff · **Depends on:** 28, 35, 36, 37, 38 · **Unlocks:** 40, 46, 51

## Goal

Generate an ordered build plan from a frozen brief/design input and its linked technical spec: numbered implementation units that a coding agent can implement and verify one at a time. This is the initial handoff capability; the later roadmap establishes full readiness and delivery evidence.

Use this repository's context-first format as a starting point, not proof that generated plans are correct. Validate coverage and test the exported workflow with a fresh agent. Specs 47–56 add the requirement, contract and readiness system needed for the full planning product.

## Read first

- `context/feature-specs/README.md`: the spec template the generated units follow
- `context/project-overview.md`, `architecture-context.md`, `code-standards.md`, `ai-workflow-rules.md`: the context documents the plan produces equivalents of
- `trigger/generate-spec.ts`, `lib/project-specs.ts`, `lib/spec/assemble-spec.ts`

## Implementation

1. **Plan contract** in `types/build-plan.ts` (zod):

   ```ts
   buildPlanSchema = {
     schemaVersion: 1,
     generationInputId: string,
     title: string,
     stack: { frontend?, backend?, database?, infrastructure?, other?: string[] },
     phases: Array<{ name: string, goal: string }>,
     units: Array<{
       number: number,            // 1-based, contiguous
       slug: string,              // kebab-case, ≤ 40
       title: string,
       phase: string,             // must match a phase name
       dependsOn: number[],       // earlier unit numbers only
       nodeIds: string[],         // canvas components this unit builds
       markdown: string,          // full unit spec in the README template
     }>,                          // 1–100 units in this preview; v2 hierarchy in spec 51
     contextDocs: {
       projectOverview: string,   // Markdown
       architectureContext: string,
       codeStandards: string,
       uiContext?: string,        // only when the design has a frontend
     },
   }
   ```

2. **Validation beyond the schema: `lib/build-plan/validate-plan.ts`** (pure).
   - Numbers run 1..n with no gaps.
   - `dependsOn` only points backwards (so a topological order exists by construction).
   - Every phase is used.
   - Every in-scope component is covered, including client/frontend work when it is part of the target project. External or excluded components need an explicit rationale. Missing coverage prevents ready export; partial plans may persist only as draft with blockers.
   - Validate all required template sections, measurable checks, setup assumptions, risks and integration/release work. Heading presence alone does not prove an actionable plan. Each scope requirement from the brief has a coverage entry; stable structured requirements arrive in spec 47.

3. **Task: `trigger/generate-build-plan.ts`** (kind `plan`, id `generate-build-plan`).
   - Inputs: one immutable generation input, a linked spec from that same input when available, matching lint findings and bounded preferences. Reject stale combinations; a plan without required source detail is draft. Do not fetch a moving "latest" spec during a batch.
   - Two generation stages (one outline call, then as many bounded batch calls as needed):
     1. the outline (stack, phases, unit titles, dependencies, node coverage)
     2. unit bodies in batches of at most 8 with pinned outline/context-contract inputs. Persist each completed batch with its outline hash and idempotency key; retries resume missing batches. Generate shared context documents once and validate cross-unit contracts after assembly.
   - Validate, with one repair attempt per call.
   - The first unit is always project setup (repository, tooling, CI, environment). A late unit covers observability and deployment. The prompt enforces both.
   - Persist:
     - Blob `plans/{projectId}/{random}.json`
     - Prisma `BuildPlan { id, projectId, runId @unique, title, filePath, unitCount, specId?, createdById, createdAt }`, with cascade and `@@index([projectId, createdAt])`
   - Chat: "Build plan ready: {n} units across {p} phases."
   - Bound each worker to `maxDuration: 600`; use durable child tasks/checkpoints for larger plans instead of stretching one request indefinitely. Charge all batch and repair calls to the run budget. Persist `generationInputId`, source hashes and readiness with BuildPlan.

4. **Routes** (member):
   - `POST /api/ai/plan` with `{ roomId, preferences? }` → 202
   - `GET /api/projects/[projectId]/plans` → summaries
   - `GET /api/projects/[projectId]/plans/[planId]` → the full plan JSON
   - `DELETE /api/projects/[projectId]/plans/[planId]` (owner or creator) → 204

5. **UI in the Specs tab:** a second section, "Build plans", under Specs.
   - A "Generate build plan" button with a Preferences disclosure. It warns if no spec exists yet ("Plans are better with a spec. Generate one first?").
   - List rows: title, unit count, author, time.
   - Preview dialog with the phases as sections and the units as collapsible rows (number, title, depends-on chips, and the rendered Markdown when expanded), plus a "Context documents" section.
   - Download and export actions arrive in spec 40.

## Scope limits

- No export or zip yet (spec 40).
- No editing plans in-app, and no syncing unit status with a repository.

## Edge cases

- The model outputs a forward dependency: validation rejects it and the repair pass must fix it. If it still fails, the run fails with "The plan had inconsistent dependencies". Never persist an invalid plan.
- A plan exceeding the preview cap is explicitly blocked with a decomposition requirement; do not merge unrelated work into oversized units just to fit. Spec 51 supports hierarchical plans and larger programs.

## Tests

- `validatePlan`: gaps, forward dependencies, unused phases, missing headings, node coverage warnings.
- The unit batching produces contiguous numbering (stub the model).
- Routes: access matrix, 409, 429.

## Check when done

- [ ] A plan generates from a real design, validates, persists, and previews.
- [ ] Every unit follows the spec template, and its dependencies only point backwards.
- [ ] Definition of done in `context/feature-specs/README.md`.

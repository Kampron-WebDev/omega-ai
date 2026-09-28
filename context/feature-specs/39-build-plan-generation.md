# 39 — Build Plan Generation

**Phase:** 6 · Handoff · **Depends on:** 28, 35, 36, 37 · **Unlocks:** 40, 46

## Goal

This is the feature that makes Omega an **agentic software-building** tool rather than a diagram tool. From the brief, the design, and the latest spec, generate an ordered build plan: numbered implementation units, each a self-contained feature spec that a coding agent (Claude Code, Cursor, Codex) can implement and verify one at a time.

The format is the one this repository is built with (see `context/feature-specs/README.md`), because it is proven to work. The plan also includes the project-level context documents a coding agent reads first.

## Read first

- `context/feature-specs/README.md`: the spec template the generated units follow
- `context/project-overview.md`, `architecture-context.md`, `code-standards.md`, `ai-workflow-rules.md`: the context documents the plan produces equivalents of
- `trigger/generate-spec.ts`, `lib/project-specs.ts`, `lib/spec/assemble-spec.ts`

## Implementation

1. **Plan contract** in `types/build-plan.ts` (zod):

   ```ts
   buildPlanSchema = {
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
     }>,                          // 5–40 units
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
   - Every non-`client` and non-`external` canvas node is covered by at least one unit. Uncovered nodes are listed as a warning in the plan and are not fatal.
   - Each unit's `markdown` contains the template's required headings (`## Goal`, `## Implementation`, `## Scope limits`, `## Check when done`).

3. **Task: `trigger/generate-build-plan.ts`** (kind `plan`, id `generate-build-plan`).
   - Inputs: graph, brief, the latest spec's Markdown if one exists (strongly recommended; the UI warns without one), the lint findings from spec 38, and the user's optional `preferences` (≤ 1000 characters, for example "Next.js + Postgres, deploy on Vercel").
   - Two model calls, to keep each one focused:
     1. the outline (stack, phases, unit titles, dependencies, node coverage)
     2. the unit bodies and context docs, generated in batches of about 8 units with the outline supplied each time, so the units stay consistent
   - Validate, with one repair attempt per call.
   - The first unit is always project setup (repository, tooling, CI, environment). A late unit covers observability and deployment. The prompt enforces both.
   - Persist:
     - Blob `plans/{projectId}/{random}.json`
     - Prisma `BuildPlan { id, projectId, runId @unique, title, filePath, unitCount, specId?, createdById, createdAt }`, with cascade and `@@index([projectId, createdAt])`
   - Chat: "Build plan ready: {n} units across {p} phases."
   - `maxDuration: 600`.

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
- A huge design (100+ nodes): the unit cap of 40 still holds; units group related components.

## Tests

- `validatePlan`: gaps, forward dependencies, unused phases, missing headings, node coverage warnings.
- The unit batching produces contiguous numbering (stub the model).
- Routes: access matrix, 409, 429.

## Check when done

- [ ] A plan generates from a real design, validates, persists, and previews.
- [ ] Every unit follows the spec template, and its dependencies only point backwards.
- [ ] Definition of done in `context/feature-specs/README.md`.

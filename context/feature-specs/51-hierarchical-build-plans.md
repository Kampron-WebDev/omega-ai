# 51 — Hierarchical Plans and Requirement Coverage

**Phase:** 9 · **Depends on:** 39, 48, 49, 50 · **Unlocks:** 52, 53, 54, 55

## Goal

Decompose a small utility or a large program into complete, testable work without a fixed 40-unit ceiling or hidden gaps. Use stable units and a dependency graph, with human-readable Markdown as a generated view.

## Read first

- `context/agentic-platform-contracts.md` and roadmap release gates.
- `types/build-plan.ts`, `lib/build-plan/validate-plan.ts`, `trigger/generate-build-plan.ts`, baseline and contract modules.

## Install

Use existing packages; select maintained validators/archive tooling only where required and verify their installed APIs.

## Environment

No new required variables. Optional integrations must validate configuration at their boundary.

## Implementation

1. Introduce build-plan schema v2 in `types/build-plan.ts`. Programs contain milestones, workstreams and leaf units; dependencies reference stable IDs. Keep a v1 reader and migrate display numbers into stable IDs once, preserving old exports.

2. Create `lib/build-plan/graph.ts`, `coverage.ts` and `readiness.ts`. Validate acyclicity, satisfied contract prerequisites, every in-scope acceptance criterion, integration units, testable scope and explicit deferred work. Coverage gaps are blocking for ready packages. Infrastructure work maps to a constraint or an explicit enabling rationale.

3. Refactor generation into persisted outline, bounded unit batches and an assembly/validation pass. Checkpoint each batch by baseline, outline hash and batch key. Resume only missing batches; cap repair attempts and total budget. Support 1–1,000 leaf units per revision, paginate by 50, and split larger programs with pinned cross-plan interfaces.

4. Each unit includes read-first references, scope/paths, consumed and produced contracts, acceptance IDs, test definitions, effort range, required capabilities, dependencies, risk, rollback and handover instructions. Test-driven vertical slices are preferred; include integration and release work rather than only feature implementation.

5. Add a plan tree and dependency/blocker view with local unit revision proposals. Display numbers are a deterministic topological ordering. Reject cross-plan cycles through the program dependency registry; unresolved external predecessors block readiness.

## Contracts

`BuildUnit { id, displayNumber, milestoneId, requirementIds[], acceptanceIds[], dependsOn[], contractRefs[], allowedPaths[], verificationIds[], effortRange, risk, markdown }`. `/plans/[id]/units?cursor=` and `/plans/[id]/readiness`; unit revisions are proposals against a pinned plan revision. Shared API/storage/access rules apply.

## Scope limits

No scheduling algorithm or execution workers yet. Do not invent dependency versions, implementation paths in existing repos, or claim every unit fits one commit.

## Edge cases

A single-unit CLI, 250-unit program, cyclic imports between subsystems, cancelled batch and uncovered nonfunctional requirement.

## Tests

DAG and coverage property tests; stable identity across insert/reorder; resumed batch generation; all headings and referenced artifacts resolvable. Include shared authorization/revision tests.

## Check when done

- [ ] Small and large plans validate without dropping requirements to meet size limits.
- [ ] Every ready unit has measurable completion and explicit dependencies.
- [ ] Definition of done and relevant release gate; record slices and verification in the tracker.


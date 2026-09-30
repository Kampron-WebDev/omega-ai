# 50 — Baselines, Revisions and Change Impact

**Phase:** 8 · **Depends on:** 39, 40, 47, 48, 49 · **Unlocks:** 51, 53, 54, 57

## Goal

Make every plan, spec and package reproducible and keep human changes from silently invalidating an agent's instructions.

## Read first

- `context/agentic-platform-contracts.md` and the roadmap release gates.
- `lib/generation-inputs.ts` from amended spec 35, artifact stores, requirements/contract modules.

## Install

Use existing dependencies unless this spec names a capability needing a maintained package. Verify installed APIs before selection; record new packages and reasons.

## Environment

None beyond the dependencies' existing configuration. Any optional integration must remain disabled until its configuration is validated.

## Implementation

1. Create `types/project-baseline.ts`, `lib/baselines.ts`, `lib/change-impact.ts` and `prisma/models/baseline.prisma`. Freeze exact artifact revisions and graph/brief hashes in a ProjectBaseline manifest. Promote earlier GenerationInput records through a versioned reader without rewriting original files.

2. Capture graph and brief together using the proven collaboration snapshot primitive. Assemble other artifacts with their exact revision IDs, then validate the revision vector. If sources change during capture, retry a bounded number of times or return 409; never label a torn read a consistent baseline.

3. Add baseline creation/list/detail and change-proposal routes. Compare semantic fields rather than timestamps. Compute affected requirements, contracts, plan units, schedules and evidence through reverse references. Untouched units retain identity and completion evidence.

4. Build `components/editor/change-review-panel.tsx`: old/new diff, affected units, unresolved conflicts and exact revision approval. Accepting a proposal creates a new baseline; it never changes a running execution's input in place.

5. Pin artifact dependencies and protect referenced revisions from individual deletion. Project-level erasure remains possible under spec 63. Record stale status and the source of each invalidation; users can export an older consistent baseline or replan.

## Contracts

`ProjectBaseline { id, schemaVersion, projectId, revisionVector, contentHash, parentId?, createdBy, createdAt }`. `/baselines` POST/GET, `/changes` POST/GET and `/changes/[id]/accept` POST. Acceptance requires expected current baseline and appropriate project policy authority. Shared access, pagination, revision, storage and error rules apply.

## Scope limits

No editing of accepted artifacts in place. No full repository merge engine in this unit.

## Edge cases

A deleted spec, two competing proposals, a source changed during capture, or a project removed during generation must not yield mixed output.

## Tests

Repeat export from one baseline after live edits; impact traversal; conflicting accepts; migration of an older generation input; missing pinned artifact failure. Include the shared authorization and concurrency checks.

## Check when done

- [ ] Exports and agent reads reproduce the same inputs after live changes.
- [ ] Only affected pending work and evidence are invalidated by a change.
- [ ] Definition of done and relevant release gate; record implementation slices and observed evidence in the tracker.


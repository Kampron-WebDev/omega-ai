# 63 — Operations, Data Lifecycle and Release Readiness

**Phase:** 12 · **Depends on:** 44, 50, 54, 56, 60, 62 · **Unlocks:** 65

## Goal

Make Omega operable and recoverable, and ensure its generated projects include the operational work necessary to ship and maintain software.

## Read first

- `context/agentic-platform-contracts.md` and roadmap release gates.
- Artifact/task/runner stores, project deletion, health/logging, baseline references and delivery policies.

## Install

Choose maintained tooling for the named validation capabilities at implementation time; keep live integration and evaluation tooling separate from ordinary unit tests.

## Environment

Dedicated non-production test/provider credentials where needed, optional until the capability is enabled. Document every new variable in the validated environment and example file; do not put secrets in fixtures.

## Implementation

1. Create `lib/operations/health.ts`, `retention.ts`, `purge.ts`, `trigger/reconcile-artifacts.ts` and `docs/operations/`. Define service indicators, alerts, incident ownership, queues, model cost visibility, rate/budget controls and provider-outage behavior. Avoid logging private source/prompts by default.

2. Implement project archive/unarchive using the existing ARCHIVED status. Archive blocks new planning/execution and remains readable; unarchive is owner-only. Erasure first revokes credentials/cancels tasks, then deletes room data, private artifacts, indexes and database records through an idempotent purge ledger.

3. Add owner-visible retention defaults, export-before-delete, source/evidence retention, deletion receipts and documented backup expiry. Referenced artifacts are retained while an active baseline requires them; project erasure overrides references. Reconcile orphan blobs, rooms, task dispatch and runner resources.

4. Establish database/artifact backup and restore procedures, migration rehearsal, dependency/secret/license checks, rollback and a release checklist. Proposed initial targets: 24-hour recovery point and four-hour recovery time, subject to selected provider capability and an observed restore drill before promising them.

5. For generated target projects, include deployment/migration/backfill procedures, environment matrix, secret ownership, monitoring, rollback and disaster recovery appropriate to the profile. Deployment evidence binds exact release and target; no automatic production action is introduced by documentation.

## Contracts

`PurgeJob { id, projectId, requestedBy, state, stages, retryAfter, receipt }`; `/archive`, `/unarchive` and `/erasure` are owner/session-only. Metrics use IDs, durations, errors and costs; retained content policies are explicit. Shared access, storage and API conventions apply.

## Scope limits

No invented compliance certification or unlimited retention. Choose observability vendors through a recorded implementation decision.

## Edge cases

Project deletion during an active worker, missing blob, provider unavailable during purge, legal/contractual retention needs and a backup restored with revoked credentials.

## Tests

Purge retry/ordering, archive restrictions, credential invalidation, orphan reconciliation, backup restore drill and outage recovery. Isolated integration data only.

## Check when done

- [ ] The team can restore service and user data through a documented, measured drill.
- [ ] Project archive and erasure cover all stores, integrations and active workers.
- [ ] Definition of done and release-gate evidence recorded. Pull forward applicable validation slices before earlier releases; this parent milestone stays incomplete until all slices are done.


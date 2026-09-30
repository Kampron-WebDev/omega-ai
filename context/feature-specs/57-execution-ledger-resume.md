# 57 — Execution Ledger, Leases and Resumption

**Phase:** 10 · **Depends on:** 50, 51, 52, 56 · **Unlocks:** 58, 60, 62

## Goal

Track work across days and agent sessions without lost progress, double claims or premature completion.

## Read first

- `context/agentic-platform-contracts.md` and roadmap release gates.
- `lib/task-runs.ts`, planning DAG, verification gates and shared ExecutionEvent contract.

## Install

Use existing dependencies; verify provider and protocol APIs before implementation.

## Environment

No new mandatory vendor configuration. Use shared validated environment and project policy; secrets never enter artifacts or logs.

## Implementation

1. Create `types/execution.ts`, `lib/execution/ledger.ts`, `claims.ts`, `resume.ts` and `prisma/models/execution.prisma`. An Execution pins a plan revision; UnitAttempt and append-only events carry leases, epochs, sequence, evidence and handover metadata.

2. Implement transactionally exclusive unit claims after checking verified prerequisites, policy and resource conflicts. Leases expire on missed heartbeat; renewal requires the active epoch. Recovery revokes the old epoch before reassigning; late reports cannot mutate current state.

3. Persist state transitions from the shared state machine, not an editable done checkbox. Acceptance evidence moves work to verified. Keep completion, integration and release separate. Blockers have an owner, reason, next action and affected dependencies.

4. Generate `resumeExecution` with exact baseline/commit, finished and pending units, failures, current environment, latest verified evidence and next safe action. Reconcile dirty work and changed repository HEAD before resuming; never blindly overwrite uncommitted changes.

5. Build `components/editor/execution-board.tsx`: milestones, assigned units, blockers, attempts and session handovers. Export a progress snapshot; import external status as untrusted until authenticated and verified. Schedule updates use observed duration without overwriting the original forecast.

## Contracts

`Execution { id, planRevisionId, policyRevision, status }`; `/executions` POST/GET; `/executions/[id]/claim`, `/heartbeat`, `/events`, `/resume`. Claims return attemptId, lease epoch and expiry. Initial routes use authorized sessions; spec 58 adds bounded agent credentials. Shared API, storage and access rules apply.

## Scope limits

No remote shell or managed code execution. Execution records do not by themselves prove repository state.

## Edge cases

Two claimers, lost heartbeat, out-of-order duplicate events, stale plan, crash after commit before report and a blocked dependency.

## Tests

Transaction integration tests with an isolated database for claim races; event deduplication and fencing; resume with a changed commit; no dependent work starts before verification. Include shared authorization and revision checks.

## Check when done

- [ ] An interrupted execution resumes from durable state with one active owner per unit.
- [ ] Reported success cannot bypass verification or dependency gates.
- [ ] Definition of done and release gate; persist verification evidence and incomplete observations in the tracker.


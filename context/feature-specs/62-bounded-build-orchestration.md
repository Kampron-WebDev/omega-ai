# 62 — Bounded Autonomous Build Orchestration

**Phase:** 11 · **Depends on:** 51, 52, 55, 56, 57, 58, 60, 61 · **Unlocks:** 63, 64, 65

## Goal

Allow an explicitly authorized agent run to implement, verify and integrate a multi-session plan, with bounded repair loops and durable recovery.

## Read first

- `context/agentic-platform-contracts.md` and roadmap release gates.
- Planning controller, execution ledger, runner, delivery integration and project authority policy.

## Install

Select and pin the minimum maintained provider SDKs needed by this spec; verify installed APIs. Do not install future integrations early.

## Environment

Reuse validated repository/runner configuration. New secrets must be optional until the integration is enabled and never appear in logs or exports.

## Implementation

1. Create `trigger/execute-build.ts` and `lib/execution/orchestrator.ts`. The deterministic scheduler selects dependency-ready units; agents implement within an isolated attempt, submit changes/evidence, then verification and integration determine progress.

2. Default to one implementation worker. Parallel workers require disjoint declared write/resource scopes and compatible pinned contracts. Isolate each branch and serialize integration; rerun cross-unit checks. Newly discovered overlap pauses integration for replanning.

3. Persist per-stage checkpoints and spend reservations across implementation, review, repair and integration. Bound retries/repair iterations per unit and total execution. Detect repeated failure without new evidence; record a blocker and continue independent permitted work.

4. Implement pause/resume/cancel that survives controller restarts. A fresh agent receives the exact resume context and verifies environment/commit before acting. Human edits create change proposals; accepted plan changes supersede affected attempts safely.

5. Build execution controls showing actual work, verification, integration, costs, blockers and next intervention. Policy separately governs installs, network calls, branch commits, PR publication and merging. Production deployments require a separate release grant with target, revision and rollback.

## Contracts

`ExecutionPolicy { planRevisionId, repositoryScope, allowedActions, protectedPaths, maxCost, maxDuration, maxParallel, maxAttempts, requiredChecks, approvalRules }`; `/executions/[id]/start|pause|resume|cancel`. Completion requires verified integrated units and release artifacts, never only worker termination. Shared API/storage/access rules apply.

## Scope limits

No open-ended self-improvement, self-modification of acceptance criteria or authority, or automatic production deploy inherited from build permission.

## Edge cases

Controller dies between command and event, late success after cancel, unmergeable parallel branches, unavailable reviewer, budget exhaustion and a plan revised mid-run.

## Tests

Multi-session fake-runner scenarios and isolated end-to-end fixtures: crash/resume, repeated failure, resource collision, cancellation, budget exhaustion and conflicting plan revisions. Include shared auth, idempotency and stale-revision checks.

## Check when done

- [ ] A representative multi-day fixture resumes after interruption without duplicate work.
- [ ] Autonomy stays within policy, and verified integrated output determines completion.
- [ ] Relevant release gate and definition of done; record exercised integrations and remaining limits.


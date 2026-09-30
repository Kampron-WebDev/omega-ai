# 55 — Collaborative and Autonomous Planning

**Phase:** 10 · **Depends on:** 34, 47, 50, 51, 52, 53, 54 · **Unlocks:** 56, 62

## Goal

Let a user choose human-led collaboration or authorize an agent to take an idea through requirements, design, review, planning and a ready package with bounded intervention.

## Read first

- `context/agentic-platform-contracts.md` and roadmap release gates.
- `lib/trigger-runs.ts`, task lease/outbox code, requirement discovery, baseline and pack readiness modules.

## Install

Use existing dependencies; verify provider and protocol APIs before implementation.

## Environment

Optional `AI_PLANNING_MAX_COST` as a server deployment ceiling; project budgets can only lower it. Model pricing/capabilities are versioned configuration, not hard-coded guesses.

## Implementation

1. Create `types/planning-session.ts`, `lib/planning/policy.ts`, `state-machine.ts` and `prisma/models/planning-session.prisma`. Store mode, baseline, allowed actions/decisions, protected constraints, spend/time/call/iteration budgets and explicit stop conditions. Only owner sessions create or widen policy.

2. Implement `trigger/plan-project.ts` as a durable controller: discover → resolve decisions → contracts/design → review → plan/schedule → readiness → package. Persist stage inputs, outputs and effect keys; use bounded child tasks. Release the planning writer lease while awaiting input; resume only after validating the current baseline.

3. Manual mode creates no autonomous effects; collaborative mode offers proposals; autonomous mode may accept routine decisions explicitly allowed by policy. It records assumptions and can finish without a human when constraints are sufficient. High-risk unresolved decisions produce `needs_input`, not fabricated certainty.

4. Reserve worst-case model budget before each call, include repairs/retries, settle actual usage and stop when exhausted. Missing pricing blocks monetary guarantees and requires an explicit token/call ceiling. Check cancellation and authority before publication. Bound review/fix loops and surface non-convergence.

5. Build a planning control panel with mode/policy summary, stage progress, cost/estimate, decisions, pause/resume/cancel, outstanding questions and readiness report. Keep partial artifacts resumable and visibly draft.

## Contracts

`PlanningSession { id, policyRevision, baselineId, stage, status: queued|running|needs_input|paused|completed|failed|cancelled, budget, usage }`. `/planning-sessions` POST/GET and `/planning-sessions/[id]/actions` POST with action and expected state. Completed means a validated ready pack exists at the declared baseline. Shared API, storage and access rules apply.

## Scope limits

Planning permission never authorizes repository writes, code execution or deployment. The controller is orchestration code, not an unbounded model loop.

## Edge cases

A human changes scope mid-run; rate limits; unknown pricing; repeated failed repair; worker interruption; input arrives twice; revocation while waiting.

## Tests

Mocked multi-stage continuation, budget reservations under concurrency, crash/restart, decision policy, non-convergence and no effects after cancellation. Include shared authorization and revision checks.

## Check when done

- [ ] A sufficiently specified project reaches a ready package without repeated human prompts.
- [ ] Ambiguity, budget exhaustion and revocation stop at explicit recoverable states.
- [ ] Definition of done and release gate; persist verification evidence and incomplete observations in the tracker.


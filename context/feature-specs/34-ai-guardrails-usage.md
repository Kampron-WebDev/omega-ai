# 34 — AI Guardrails, Cancellation, and Usage

**Phase:** 5 · AI design agent · **Depends on:** 31, 33 · **Unlocks:** safe exposure of every later AI feature

## Goal

Make AI features safe to operate: per-user rate limits, a way to cancel a run, automatic cleanup of runs that died, token usage recorded per run, and structured logs. Spec, review, and plan tasks (35–39) inherit all of it through `lib/trigger-runs.ts`.

## Read first

- `lib/trigger-runs.ts`, `lib/task-runs.ts`, `trigger/design-agent.ts`
- Trigger.dev docs for `runs.cancel`, scheduled tasks (`schedules.task`), and run metadata
- The AI SDK result type for token usage in the installed `ai` version

## Implementation

1. **Rate limits: `lib/ai/limits.ts`.**

   | Kind | Per user per hour | Per user per day |
   | --- | --- | --- |
   | design | 30 | 200 |
   | spec | 10 | 40 |
   | review | 10 | 40 |
   | plan | 5 | 20 |

   - Counted from `TaskRun` rows (`userId`, `kind`, `createdAt`) through the existing `@@index([userId, createdAt])`. No Redis.
   - `startAiRun` checks the limit first and answers `429 rate_limited` with a `Retry-After` header and `retryAfterSeconds` in the error body.
   - The composer shows "You've reached the hourly limit for AI designs. Try again in 12 min."

2. **Cancellation.**
   - `POST /api/ai/runs/[runId]/cancel`: allowed for the requester or the project owner.
   - Atomically revoke the run's publication lease/epoch and set CANCELLING before requesting provider cancellation. Persist an idempotent cancellation/cleanup intent; a reconciler completes remote cancellation, status, presence and canonical chat if the route dies. Unknown in-flight effects move to RECONCILING and prevent a new conflicting writer until resolved. Only confirmed stop/cleanup becomes CANCELLED. A fenced worker cannot publish success or further graph changes.
   - The status strip shows a Cancel button (a small X) for the requester and the owner.
   - A cancelled design run may have written nodes already. The system message carries the run's `checkpointId` (looked up from the `AI_RUN` checkpoint), so "Undo AI changes" is offered.

3. **Stale-run reaper: `trigger/reap-stale-runs.ts`.**
   - A scheduled task every 10 minutes.
   - Select non-terminal runs with expired heartbeat leases, reconcile provider state, revoke/fence the old attempt and cancel it before releasing conflicting work. Long workflows with fresh heartbeats are not killed for being older than 15 minutes. An unknown remote outcome remains reconciling.
   - This is what makes `AI_STATUS_STALE_MS` a true backstop and not the only guard.

4. **Usage accounting.**
   - Add `model String?`, `inputTokens Int?`, `outputTokens Int?`, and `durationMs Int?` to `TaskRun`.
   - Aggregate usage for every model call, repair and retry, with model/version and recorded pricing version. Record partial usage on failure; reserve conservative token/cost ceilings before paid calls. Count-based rate limits alone are not a spending budget. Spec 55 adds owner-facing policy controls.

5. **Structured logging: `lib/logger.ts`.**
   - JSON lines with `level`, `msg`, `runId`, `projectId`, `userId`, `task`, and `durationMs`.
   - Used in `lib/trigger-runs.ts`, every task, and the AI routes.
   - Never log prompts, chat content, or brief text. Log their lengths only.

6. **Input caps.** Centralize them in `lib/ai/limits.ts`:
   - prompt: 4000 characters
   - chat history window: 20 messages / 12,000 characters
   - brief: 16,000-character initial context budget; select relevant sections and retain all applicable accepted constraints. If mandatory material cannot fit, partition the task or fail with a capacity explanation. Never silently truncate acceptance criteria or constraints; spec 53 generalizes selection/provenance.

   The design prompt builder uses these constants.

## Contracts

| Route | Access | Success | Errors |
| --- | --- | --- | --- |
| `POST /api/ai/runs/[runId]/cancel` | requester or owner, with current project access | `202 { runId, phase: "cancelling" \| "reconciling" }`, or `200 { cancelled: true }` if confirmed | 401, 404, 409 (already finished) |
| `POST /api/ai/design` (updated) | member | `202` | adds 429 |

## Scope limits

- No billing, plans, or quotas per organization (out of scope in `project-overview.md`).
- No usage dashboard UI. The data is recorded for later.

## Edge cases

- Cancel arrives after the task finished: answer `409` with "This request already finished", and publish nothing.
- The reaper runs on a run the task is still finishing: `markRunStatus` only moves forward (never from a terminal state back), so the later write loses.
- A limit check and a trigger race for the last slot: accept at most one extra run; exactness is not required.

## Tests

- Limits: under the limit passes; at the limit → 429 with a correct `Retry-After`.
- Cancel route: requester ok, owner ok, other member 404, finished run 409; publishes and clears in order.
- Reaper: selects only stale non-terminal runs.
- `markRunStatus` never moves a terminal status backwards.
- The logger never serializes fields named `prompt`, `content`, or `brief`.

## Check when done

- [ ] Hitting a limit shows a clear message and a retry time.
- [ ] Cancel stops a run, and the room sees it immediately.
- [ ] A killed worker is fenced and reconciled within the documented heartbeat-expiry plus reaper interval; no new writer starts while the old effect outcome is uncertain.
- [ ] `TaskRun` rows carry model, tokens, and duration.
- [ ] Definition of done in `context/feature-specs/README.md`.

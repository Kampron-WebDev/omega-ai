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
   - It calls `runs.cancel`, marks the run CANCELLED, publishes status `cancelled` ("{name} cancelled the request"), clears agent presence, and posts a system chat message. The last three are done by the **route**, because a cancelled task may never run its own cleanup.
   - The status strip shows a Cancel button (a small X) for the requester and the owner.
   - A cancelled design run may have written nodes already. The system message carries the run's `checkpointId` (looked up from the `AI_RUN` checkpoint), so "Undo AI changes" is offered.

3. **Stale-run reaper: `trigger/reap-stale-runs.ts`.**
   - A scheduled task every 10 minutes.
   - Runs still QUEUED or RUNNING after 15 minutes are marked FAILED with "Timed out", a status `failed` is published to their room, and presence is cleared.
   - This is what makes `AI_STATUS_STALE_MS` a true backstop and not the only guard.

4. **Usage accounting.**
   - Add `model String?`, `inputTokens Int?`, `outputTokens Int?`, and `durationMs Int?` to `TaskRun`.
   - Every AI task records them from the SDK result when the run finishes, in both the success and failure paths.

5. **Structured logging: `lib/logger.ts`.**
   - JSON lines with `level`, `msg`, `runId`, `projectId`, `userId`, `task`, and `durationMs`.
   - Used in `lib/trigger-runs.ts`, every task, and the AI routes.
   - Never log prompts, chat content, or brief text. Log their lengths only.

6. **Input caps.** Centralize them in `lib/ai/limits.ts`:
   - prompt: 4000 characters
   - chat history window: 20 messages / 12,000 characters
   - brief: `briefToMarkdown` truncated at 16,000 characters, with a note in the prompt that it was truncated

   The design prompt builder uses these constants.

## Contracts

| Route | Access | Success | Errors |
| --- | --- | --- | --- |
| `POST /api/ai/runs/[runId]/cancel` | requester or owner | `200 { cancelled: true }` | 401, 404, 409 (already finished) |
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
- [ ] A killed worker's run clears itself within about 15 minutes.
- [ ] `TaskRun` rows carry model, tokens, and duration.
- [ ] Definition of done in `context/feature-specs/README.md`.

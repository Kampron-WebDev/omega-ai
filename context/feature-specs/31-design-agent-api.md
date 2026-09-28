# 31 — Design Agent API and Run Tracking

**Phase:** 5 · AI design agent · **Depends on:** 29, 30 · **Unlocks:** 32, 33, 34, 35, 38, 39

## Goal

Stand up the background-task backbone every AI feature uses: Trigger.dev in the repo, a `TaskRun` table that records who started what, a route that starts a design run, a token route, an active-run lookup for reconnecting, and a **stub** design task that talks to the room (status, presence, a chat reply) without calling any AI. When this unit is done, the whole pipeline is proven end to end, and spec 33 only swaps the stub's body.

## Read first

- `context/architecture-context.md`, invariant 1: request handlers never run AI work
- Trigger.dev v4 docs for the installed version: `task` / `schemaTask`, `tasks.trigger` (and the `publicAccessToken` on its returned handle), `auth.createPublicToken`, queues and `concurrencyKey`, `trigger.config.ts`, and local `dev`
- `lib/prisma.ts` and `generated/prisma`. Tasks import Prisma through `lib/prisma.ts`; Prisma 7's generated client plus the pg adapter needs no native engine, but confirm the task bundle builds.
- `lib/liveblocks-feeds.ts` and `types/tasks.ts` from specs 29–30

## Install

- `@trigger.dev/sdk`. Match the CLI version when running `npx trigger.dev@<same> dev`.

## Environment

- `TRIGGER_SECRET_KEY` (server; in `lib/env.ts`)
- `TRIGGER_PROJECT_REF` (read by `trigger.config.ts`)
- The Trigger.dev project's own environment needs `DATABASE_URL` and `LIVEBLOCKS_SECRET_KEY` (and later `GOOGLE_AI_API_KEY` and `BLOB_READ_WRITE_TOKEN`). Document this in `README.md`.

## Implementation

1. **`trigger.config.ts`.**
   - `project` from `TRIGGER_PROJECT_REF`; `dirs: ["./trigger"]`
   - default `maxDuration` 300 s
   - default retry: 2 attempts with exponential backoff. Each task can override.
   - Exclude `trigger/` from the Next.js type-check scope only if the two toolchains conflict, and record why.

2. **Model** in `prisma/models/task-run.prisma`:

   ```prisma
   enum TaskRunKind   { DESIGN SPEC REVIEW PLAN }
   enum TaskRunStatus { QUEUED RUNNING COMPLETED FAILED CANCELLED }

   model TaskRun {
     id          String        @id @default(cuid())
     runId       String        @unique
     projectId   String
     userId      String
     kind        TaskRunKind
     status      TaskRunStatus @default(QUEUED)
     prompt      String?       // first 2000 chars; for audit and "requested by" UI
     error       String?       // safe, user-facing message
     createdAt   DateTime      @default(now())
     updatedAt   DateTime      @updatedAt
     completedAt DateTime?

     project Project @relation(fields: [projectId], references: [id], onDelete: Cascade)

     @@index([userId, projectId])
     @@index([projectId, status])
     @@index([userId, createdAt])
   }
   ```

   This closes the missing-cascade open question for `TaskRun`.

3. **`lib/task-runs.ts`** (server only).
   - `createTaskRun`
   - `findRunForUser(runId, userId)`, used for token issuance
   - `findActiveRun(projectId)`: any kind, status `QUEUED` or `RUNNING`, created within `AI_STATUS_STALE_MS`
   - `markRunStatus(runId, status, { error? })`, which sets `completedAt` on terminal states

   **One active AI run per project, of any kind**: a spec generated while the design agent is editing would describe a half-changed graph.

4. **`lib/trigger-runs.ts`**, the single place route handlers call Trigger.dev. `startAiRun({ kind, taskId, payload, projectId, userId, prompt })`:
   1. reject if `findActiveRun` finds one
   2. `tasks.trigger` with `concurrencyKey: projectId` on a queue with `concurrencyLimit: 1` (belt and braces with step 1 against simultaneous requests), `tags: [project:{id}, user:{id}]`, and an `idempotencyKey` derived from the request
   3. `createTaskRun` with the returned ID
   4. return `{ runId, publicAccessToken }` from the run handle

5. **`POST /api/ai/design`**, body `{ roomId, prompt }` (prompt 1–4000 characters after trimming).
   - Authenticate, then parse with zod, then member check. The `projectId` comes from the access check.
   - An active run → `409 conflict` with `{ activeRun: { runId, task, requestedBy } }` in the error body, so the UI can say who is running what.
   - Payload `{ projectId, roomId, prompt, requestedBy: { id, name } }`.
   - Answers `202 { runId, publicAccessToken }`.

6. **`POST /api/ai/runs/[runId]/token`** replaces the old per-feature token routes.
   - Only the run's requester (`findRunForUser`).
   - Mints `auth.createPublicToken` with read scope limited to that one run, expiring in 1 hour.
   - Anyone else gets `404`. Collaborators follow runs through the status feed, not tokens.

7. **`GET /api/ai/runs/active?roomId=`** (member) → `{ run: { runId, kind, requestedBy, isMine } | null }`. Lets a reloaded requester reattach.

8. **Stub task: `trigger/design-agent.ts`.**
   - `schemaTask` with id `design-agent` and a zod payload.
   - Its body:
     1. `markRunStatus` RUNNING
     2. `publishStatus` running "Reading your prompt…"
     3. `setAgentPresence` thinking at `{ x: 0, y: 0 }`
     4. wait 2 s
     5. `postChatMessage` from the assistant: "Design generation is not connected yet. You asked: …" (prompt quoted, truncated to 280)
     6. `publishStatus` completed; `clearAgentPresence`; `markRunStatus` COMPLETED
   - Failure path (the task's failure hook or try/finally): status failed with a generic message, an error chat message (`tone: "error"`), presence cleared, and `markRunStatus` FAILED. Never leak stack traces into the room.
   - `maxAttempts: 1` for the stub.

9. **Error vocabulary.** Add `rate_limited` (429) to `lib/api-response.ts` now; spec 34 uses it. Keep the existing codes unchanged.

10. **Close spec 26's TODO.** Checkpoint restore (and template import's checkpoint step) answers `409 conflict` while `findActiveRun` finds a run, so a restore can never race the design agent's writes. Remove the `TODO(spec-31)` marker.

## Contracts

| Route | Access | Success | Errors |
| --- | --- | --- | --- |
| `POST /api/ai/design` | member | `202 { runId, publicAccessToken }` | 400, 401, 404, 409 |
| `POST /api/ai/runs/[runId]/token` | requester | `200 { publicAccessToken }` | 401, 404 |
| `GET /api/ai/runs/active?roomId=` | member | `200 { run \| null }` | 400, 401, 404 |

```ts
// trigger payload for every AI task
interface AiTaskPayload {
  projectId: string
  roomId: string
  requestedBy: { id: string; name: string }
}
interface DesignTaskPayload extends AiTaskPayload { prompt: string }
```

## Scope limits

- No AI provider, no canvas mutation, no UI wiring (spec 32).
- No rate limiting yet (spec 34).

## Edge cases

- Trigger.dev is unreachable when starting a run: answer `503` with "AI is temporarily unavailable". Add a `service_unavailable` code. No `TaskRun` row is created.
- The row insert fails after the trigger succeeded: cancel the run best-effort, then answer `500`.
- The same request retried by the browser does not start two runs (idempotency key plus single-flight).

## Tests

- Route tests with `@trigger.dev/sdk`, Prisma, and auth mocked: 401, 400, 404, 409 (with an `activeRun` body), 202; the payload `projectId` comes from access, not the body.
- Token route: the requester gets a token; another member gets 404.
- `findActiveRun` ignores stale runs.

## Check when done

- [ ] `npx trigger.dev dev` runs the stub; sending a prompt through the route shows status, presence, and a reply in two browsers.
- [ ] `TaskRun` rows move QUEUED → RUNNING → COMPLETED (or FAILED).
- [ ] A second prompt during a run answers 409.
- [ ] `README.md` documents running Trigger.dev locally and its environment.
- [ ] Definition of done in `context/feature-specs/README.md`.

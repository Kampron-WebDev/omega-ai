# 32 — AI Chat, End to End

**Phase:** 5 · AI design agent · **Depends on:** 30, 31 · **Unlocks:** 33

## Goal

Make the AI Architect tab a working product surface against the stub task. Submitting a prompt posts it to the room, starts a design run, follows that run live for the requester, and shows everyone the reply. A reload in the middle of a run picks up where it left off. When spec 33 replaces the stub, no UI change is needed.

## Read first

- `components/editor/ai-architect-tab.tsx`, `ai-chat-composer.tsx`, `hooks/use-ai-status.ts`
- `app/api/ai/design/route.ts`, `app/api/ai/runs/*`, `lib/trigger-runs.ts`
- Trigger.dev React hooks docs for the installed version (`useRealtimeRun`)

## Install

- `@trigger.dev/react-hooks`, at the same version as `@trigger.dev/sdk`

## Implementation

1. **One durable admission.** The spec 31 transaction reserves the run and creates its canonical prompt together, with the internal run ID already available. A rejected admission posts nothing. An accepted run that later fails dispatch retains the prompt and a visible failed status. The client supplies one idempotency key across retries; notification retries never duplicate the prompt.

2. **`hooks/use-ai-run.ts`** (the requester's view of their own run).
   - On mount, `GET /api/ai/runs/active?roomId=`. If `isMine`, fetch a token for that run and reattach.
   - `submit(prompt)` calls the design route, then stores `AiRunHandle`. A queued run may not have a provider ID/token yet; retry attachment with bounded backoff while server state remains queued, without resubmitting the prompt.
   - Follow persisted QUEUED status until dispatch attaches `providerRunId`, then call `useRealtimeRun(providerRunId, { accessToken })`. Internal and provider IDs are not interchangeable. Server status remains authoritative on reconnect or notification loss.
   - Clears local run state on any terminal status.
   - A token rejected mid-run (expired) is refreshed once through the token route.

3. **Composer behavior.**
   - Submit is disabled while `useAiStatus().isBusy` (room-wide, from spec 29) or while this client's request is in flight.
   - A 409 answer shows inline above the composer: "Ghost AI is working on {requester}'s request. Try again when it finishes." Other errors show the route's message. The draft is kept in both cases.
   - The draft clears only after a successful 202.

4. **Replies come from the task, not the client.** The client never posts assistant messages. The old requirement to "push a final AI message" from the browser is dropped, because it would be lost whenever the requester closes the tab.

5. **Status strip.** The strip from spec 29 already shows room-wide progress. For the requester only, add the run's elapsed time ("12s").

6. **Styling.** Keep the spec 20 tokens: the user bubble is `bg-accent-dim border-brand/50`, the send button `bg-ai`. The green hex (`#62C073`) in the original version of this spec was a node-palette value, not a UI token, and is not used. This is recorded under Architecture Decisions.

## Scope limits

- No AI logic (spec 33), no cancel button (spec 34), no Markdown rendering (spec 37).
- Do not update the canvas from the client.

## Edge cases

- The requester reloads during a run: the strip keeps showing (feed), submit stays disabled (feed), and the elapsed timer resumes (reattach).
- Two users submit at the same moment: one gets 202, the other gets 409 and keeps their draft.
- The run finishes while the page is hidden: the reply is already in the feed when the user returns.

## Tests

- `useAiRun` (jsdom, mocked fetch and hooks): reattach when `isMine`; no reattach for someone else's run; 409 keeps the draft and sets the inline message; the token is refreshed once on an auth error.
- Design route: posts the chat message only after the checks pass; posts nothing on 409.

## Check when done

- [ ] A prompt appears in the room, the stub runs, and the reply appears for everyone.
- [ ] A reload mid-run reattaches.
- [ ] Conflicts and failures show inline and keep the draft.
- [ ] Definition of done in `context/feature-specs/README.md`.

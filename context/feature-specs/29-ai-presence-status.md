# 29 — AI Presence and Shared Status

**Phase:** 5 · AI design agent · **Depends on:** 20, 21 · **Unlocks:** 30, 31, 32, 33

## Goal

Everyone in a room sees when the AI is working, what it is doing, and where on the canvas it is working. This unit builds the realtime contracts and UI: the `ai-status-feed` feed, a room-wide "AI is busy" state, a thinking spinner on cursors, and the AI agent as a visible participant. Nothing generates anything yet; the stub task in spec 31 is the first real publisher.

## Read first

- `liveblocks.config.ts` (`Presence.thinking` already exists) and `app/api/liveblocks-auth/route.ts`
- `node_modules/@liveblocks/node/dist/index.d.ts`: `getFeeds`, `createFeed`, `createFeedMessage`, `setPresence`
- `node_modules/@liveblocks/react/dist/room-*.d.ts`: `useFeedMessages`, `useCreateFeedMessage`
- `components/editor/canvas-cursors.tsx`, `canvas-presence.tsx`, `ai-sidebar.tsx`, `ai-chat-composer.tsx`

## Implementation

1. **Contracts: `types/tasks.ts`** (zod, shared by client, routes, and tasks).
   - `AI_FEEDS = { chat: "ai-chat", status: "ai-status-feed" } as const`
   - `AI_AGENT = { userId: "omega-ai", name: "Ghost AI", color: "#8b82ff" }`. The color is a data value sent over the wire, the same reasoning as `CURSOR_COLORS`.
   - `aiTaskKindSchema`: `"design" | "spec" | "review" | "plan"`
   - `aiRunPhaseSchema`: `"queued" | "running" | "completed" | "failed" | "cancelled"`
   - `aiStatusMessageSchema`: `{ type: "status", runId, task, phase, text?: string (≤ 280), progress?: number (0–1), requestedBy: { id, name } }`
   - `AI_STATUS_STALE_MS = 15 * 60 * 1000`: a queued or running status older than this counts as ended, so a crashed task can never lock the room forever. Spec 34 adds the server-side reaper.

2. **Feeds exist in every room: `lib/liveblocks-feeds.ts`** (server only).
   - `ensureRoomFeeds(roomId)`: `getFeeds`, then `createFeed` for each missing ID in `AI_FEEDS`. A concurrent "already exists" answer counts as success.
   - Called in `POST /api/liveblocks-auth` right after `getOrCreateRoom`. Cache the "known ready" room IDs in memory for the process lifetime, so the token route does not add two API calls to every connection.
   - `publishStatus(roomId, message)` validates with `aiStatusMessageSchema`, then `createFeedMessage`.
   - `setAgentPresence(roomId, { cursor, thinking }, ttlSeconds)` wraps `liveblocks.setPresence` with `userId: AI_AGENT.userId` and `userInfo: { name, avatar: "", color }`. `clearAgentPresence(roomId)` sets `thinking: false`, `cursor: null`, and the minimum TTL.

3. **`hooks/use-ai-status.ts`** (client).
   - Reads `useFeedMessages(AI_FEEDS.status)`, parses newest-first with `safeParse`, and skips invalid messages (log once in development).
   - Returns `{ latest, isBusy, activeRun }`. `isBusy` is true when the latest message's phase is `queued` or `running` and it is younger than `AI_STATUS_STALE_MS`.
   - Re-evaluates staleness on a 30 s timer, so an abandoned run clears without a new message.

4. **Sidebar busy state.**
   - A compact status strip above the composer while busy: a small animated indicator in `text-ai-text`, the status text (or "Ghost AI is working…"), the task label, and "requested by {name}".
   - After a terminal phase, the strip shows the final text for 6 s (completed in `text-ai-text`, failed in `text-destructive`), then hides.
   - While busy, **for everyone in the room**: the composer textarea stays editable (people can draft) but submit is disabled, and the send button shows a spinner. Tabs, the brief, and the rest of the sidebar stay usable.

5. **Thinking cursors.** In `canvas-cursors.tsx`, a participant with `presence.thinking === true` shows a small spinner (`Loader2`, `animate-spin`, `size-3`) inside the name badge.

6. **The AI as a participant.**
   - `canvas-presence.tsx` renders the participant whose ID is `AI_AGENT.userId` first in the avatar stack, as a `Bot` icon on `bg-ai/15` with an `ai` ring, and not counted against the five-avatar limit.
   - Its cursor uses the agent color and name. The Clerk-ID filter and dedupe must not drop it.

## Contracts

```ts
type AiTaskKind = "design" | "spec" | "review" | "plan"
type AiRunPhase = "queued" | "running" | "completed" | "failed" | "cancelled"

interface AiStatusMessage {
  type: "status"
  runId: string
  task: AiTaskKind
  phase: AiRunPhase
  text?: string
  progress?: number
  requestedBy: { id: string; name: string }
}
```

## Scope limits

- No chat messages. That is spec 30.
- No background tasks and no AI calls.
- Do not show the full status history; only the latest message matters.
- Do not dim or block the sidebar.

## Edge cases

- The feed does not exist yet in a room created before this unit: `ensureRoomFeeds` on the next token request fixes it; until then `useFeedMessages` returns empty and the UI shows idle.
- A malformed feed message never crashes the sidebar.
- Two tabs of the same user both show the busy state.

## Tests

- `aiStatusMessageSchema` accepts valid messages and rejects an unknown phase or over-long text.
- `useAiStatus` (jsdom, mocked `useFeedMessages`): busy while running; not busy after completed; not busy once stale; invalid messages skipped.
- `ensureRoomFeeds`: creates only the missing feeds and treats a conflict as success.

## Check when done

- [ ] Every room has `ai-chat` and `ai-status-feed` after connecting.
- [ ] A status message published server-side (verify with a one-off script calling `publishStatus`, then delete the script) shows the strip in two browsers and disables submit in both.
- [ ] Thinking cursors show a spinner; the AI agent appears in the avatar stack.
- [ ] Definition of done in `context/feature-specs/README.md`.

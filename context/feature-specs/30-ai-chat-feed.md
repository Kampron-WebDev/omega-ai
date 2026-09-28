# 30 — Shared AI Chat Feed

**Phase:** 5 · AI design agent · **Depends on:** 29 · **Unlocks:** 32, 33

## Goal

Replace the sidebar's local-only messages (spec 20) with a room-wide conversation in the `ai-chat` feed. Everyone in the room sees the same thread, which becomes the AI's conversational memory in spec 33.

**Messages are written by the server.** A feed message carries no verified author, so a client posting directly could put any name on a message. User messages go through an authenticated route that stamps the author from the Clerk session. Assistant messages come from tasks.

## Read first

- `types/tasks.ts` and `lib/liveblocks-feeds.ts` from spec 29
- `components/editor/ai-architect-tab.tsx` (the local `messages` state being replaced) and `ai-chat-composer.tsx`
- `lib/project-access.ts` (`getCurrentUserProfile`) and `lib/api-response.ts`

## Implementation

1. **Contract.** Add to `types/tasks.ts`:

   ```ts
   aiChatMessageSchema = {
     type: "chat",
     role: "user" | "assistant" | "system",
     author: { id: string, name: string, avatar: string },
     content: string,          // 1–4000 chars, Markdown
     runId?: string,
     checkpointId?: string,    // spec 33: enables "Undo AI changes"
     tone?: "default" | "error",
   }
   ```

   The timestamp is the feed message's own `createdAt`; it is not duplicated in the data.

2. **Server helper.** `postChatMessage(roomId, message)` in `lib/liveblocks-feeds.ts`: validate, then `createFeedMessage`.

3. **Route: `POST /api/ai/chat`**, body `{ roomId, content }`.
   - Member check.
   - The author comes from `getCurrentUserProfile()`, never from the body.
   - Answers `201 { id }`.
   - Used for plain messages to the room. Spec 32 posts prompts through the design route instead.

4. **Sidebar.**
   - `ai-architect-tab.tsx` reads `useFeedMessages(AI_FEEDS.chat)`, validates each message, and renders the newest 200 in order.
   - A message from the current user (`author.id === self.id`) is right-aligned with the user bubble style from spec 20. Other users' messages are left-aligned with a small avatar and name. Assistant messages are left-aligned with the Bot avatar and the assistant style. `tone: "error"` messages use `text-destructive` with a `border-destructive/40` border.
   - Consecutive messages from the same author within 2 minutes are grouped: avatar and name only on the first.
   - Relative timestamps on hover (a `title` attribute) and under each group.
   - Assistant content renders as plain text with line breaks preserved. Markdown rendering arrives with `react-markdown` in spec 37, and the bubble is then switched to it.
   - Auto-scroll to the newest message only when the user is already near the bottom. Otherwise show a "New messages" pill that scrolls down.

5. **Sending.**
   - The composer sends through the route. While in flight, an optimistic pending bubble shows at reduced opacity, then is replaced by the feed copy (matched by the returned `id`).
   - On failure the bubble shows "Not sent — Retry", and the draft is kept.
   - The input clears only after success.
   - The empty state and starter chips stay. A chip still fills the composer.

## Scope limits

- No AI replies and no task triggering.
- No editing or deleting messages, and no reactions.
- No Markdown rendering yet.

## Edge cases

- **Known limitation:** Liveblocks room tokens allow `room:write`, so a crafted client could still post directly to the feed. The UI trusts only schema-valid messages, and the author name comes from the server path. Record this under Open Questions so the token scope can be revisited if Liveblocks adds feed-level permissions.
- The feed is empty or still loading: show the empty state. There is no spinner flash for an empty room.
- Messages that fail validation are skipped and never rendered raw.

## Tests

- Route: 401, 400 for empty or over-long content, 404 for a non-member, 201 with the author taken from the session even when the body sends a fake `author`.
- Grouping logic as a pure function (`groupChatMessages`) with unit tests.
- jsdom: pending bubble, then feed message, replaces rather than duplicates.

## Check when done

- [ ] Messages sent from one browser appear in another in order, with author and time.
- [ ] Author identity cannot be set from the request body.
- [ ] The local message state from spec 20 is gone.
- [ ] Definition of done in `context/feature-specs/README.md`.

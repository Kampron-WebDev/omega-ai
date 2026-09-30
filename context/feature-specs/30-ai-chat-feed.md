# 30 — Shared AI Chat Feed

**Phase:** 5 · AI design agent · **Depends on:** 29 · **Unlocks:** 32, 33

## Goal

Replace the sidebar's local-only messages (spec 20) with a room-wide conversation in the `ai-chat` feed. Everyone in the room sees the same thread, which becomes the AI's conversational memory in spec 33.

**Canonical messages are written by the server to PostgreSQL.** Room writers can forge feed messages, so schema validation alone does not establish authorship. Add `ChatMessage` records scoped to project with role, verified author ID, bounded content, internal run ID, request key and monotonic sequence. Feeds notify clients about record IDs; the access-checked database record is the authority for rendering and AI context.

## Read first

- `types/tasks.ts` and `lib/liveblocks-feeds.ts` from spec 29
- `components/editor/ai-architect-tab.tsx` (the local `messages` state being replaced) and `ai-chat-composer.tsx`
- `lib/project-access.ts` (`getCurrentUserProfile`) and `lib/api-response.ts`

## Implementation

1. **Model** in `prisma/models/chat.prisma`, one migration named `chat_messages`:

   ```prisma
   enum ChatMessageRole { USER ASSISTANT SYSTEM }
   enum ChatMessageTone { DEFAULT ERROR }

   model ChatMessage {
     id           String          @id @default(cuid())
     projectId    String
     sequence     Int             // monotonic per project
     role         ChatMessageRole
     authorId     String?         // Clerk user ID from the session; null for assistant and system
     authorName   String          // captured from the session (or the agent) at write time
     authorAvatar String
     content      String          // 1–4000 characters
     runId        String?         // internal TaskRun ID (spec 31)
     checkpointId String?         // spec 33
     tone         ChatMessageTone @default(DEFAULT)
     eventKey     String          // idempotency key; a retried write returns the existing row
     createdAt    DateTime        @default(now())

     project Project @relation(fields: [projectId], references: [id], onDelete: Cascade)

     @@unique([projectId, sequence])
     @@unique([projectId, eventKey])
   }
   ```

   Allocate `sequence` inside the insert transaction by incrementing a `chatSequence Int @default(0)` column on `Project`; the unique index is the backstop.

2. **Contract.** Add to `types/tasks.ts` the shape the API returns:

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

   Each returned message also carries `id`, `sequence`, and `createdAt` from its database row. The timestamp and sequence come from the canonical record. Notification timestamps are transport metadata and do not determine authorship or order.

   The `ai-chat` feed carries only `aiChatNotificationSchema = { type: "chat", messageId: string, sequence: number }`. A client that receives one refetches from the route; it never renders the notification itself.

3. **Server helper.** `postChatMessage(roomId, message)` validates and inserts one canonical record with an idempotent event key, then publishes a retryable notification. Add `GET /api/ai/chat?roomId=&cursor=` (member, 50 messages/page) for hydration/reconnect. A failed notification never loses the saved message.

4. **Route: `POST /api/ai/chat`**, body `{ roomId, content }`.
   - Member check.
   - The author comes from `getCurrentUserProfile()`, never from the body.
   - Answers `201 { id }`.
   - Used for plain messages to the room. Spec 32 posts prompts through the design route instead.

5. **Sidebar.**
   - `ai-architect-tab.tsx` hydrates canonical messages and uses feed notifications only to refetch. Render the newest 200 in server sequence order; older history is paginated. Prompt builders read canonical rows, never arbitrary feed payloads.
   - A message from the current user (`author.id === self.id`) is right-aligned with the user bubble style from spec 20. Other users' messages are left-aligned with a small avatar and name. Assistant messages are left-aligned with the Bot avatar and the assistant style. `tone: "error"` messages use `text-destructive` with a `border-destructive/40` border.
   - Consecutive messages from the same author within 2 minutes are grouped: avatar and name only on the first.
   - Relative timestamps on hover (a `title` attribute) and under each group.
   - Assistant content renders as plain text with line breaks preserved. Markdown rendering arrives with `react-markdown` in spec 37, and the bubble is then switched to it.
   - Auto-scroll to the newest message only when the user is already near the bottom. Otherwise show a "New messages" pill that scrolls down.

6. **Sending.**
   - The composer sends through the route. While in flight, an optimistic pending bubble shows at reduced opacity, then is replaced by the canonical message (matched by the returned `id`).
   - On failure the bubble shows "Not sent — Retry", and the draft is kept.
   - The input clears only after success.
   - The empty state and starter chips stay. A chip still fills the composer.

## Contracts

| Route | Access | Success | Errors |
| --- | --- | --- | --- |
| `POST /api/ai/chat` | member | `201 { id }` | 400, 401, 404 |
| `GET /api/ai/chat?roomId=&cursor=` | member | `200 { messages: AiChatMessage[], nextCursor: string \| null }`, oldest first, 50 per page | 400, 401, 404 |

- `cursor` is an opaque token for the sequence to page back from; omit it for the newest page.

## Scope limits

- No AI replies and no task triggering.
- No editing or deleting messages, and no reactions.
- No Markdown rendering yet.

## Edge cases

- Forged feed payloads and nonexistent/foreign message IDs are ignored; they cannot impersonate an assistant or enter prompt context. Reconnect catches up from the database even if feed delivery was missed.
- The feed is empty or still loading: show the empty state. There is no spinner flash for an empty room.
- Messages that fail validation are skipped and never rendered raw.

## Tests

- Route: 401, 400 for empty or over-long content, 404 for a non-member, 201 with session author. Test forged assistant feed messages, duplicate notification delivery, missed notifications and canonical cursor catch-up.
- Grouping logic as a pure function (`groupChatMessages`) with unit tests.
- jsdom: the pending bubble is replaced by the canonical message rather than duplicated, and a notification triggers a refetch rather than rendering its payload.

## Check when done

- [ ] Messages sent from one browser appear in another in order, with author and time.
- [ ] Author identity cannot be set from the request body.
- [ ] The local message state from spec 20 is gone.
- [ ] Definition of done in `context/feature-specs/README.md`.

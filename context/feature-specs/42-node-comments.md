# 42 — Comments on Nodes

**Phase:** 7 · Collaboration depth · **Depends on:** 24, 35, 38, 39 · **Unlocks:** richer generation input and review context

## Goal

Let reviewers discuss a design where the design is: comment threads attached to nodes, visible as badges on the canvas, readable in the inspector, and listed in one place. Unresolved threads also become context for the spec, review, and plan tasks, so open discussion ends up in "Open Questions" instead of being lost.

## Read first

- Liveblocks Comments docs for the installed version: `useThreads`, `useCreateThread`, thread metadata, `resolveUsers` / `resolveMentionSuggestions`, and `@liveblocks/react-ui` components with their styling hooks
- `liveblocks.config.ts`, `components/editor/canvas-room.tsx` (`RoomProvider` / `LiveblocksProvider`), `canvas-inspector.tsx`, `canvas-node.tsx`
- `lib/clerk-users.ts` and `lib/collaborators.ts`: how members are resolved

## Install

- `@liveblocks/react-ui`, at the same version as the other Liveblocks packages

## Implementation

1. **Types.** `liveblocks.config.ts` declares `ThreadMetadata = { nodeId: string; resolvedNodeLabel?: string }`. The label is kept for display after a node is deleted.

2. **User resolution.**
   - `POST /api/liveblocks/users`, body `{ roomId, userIds }` (≤ 50 IDs), member check.
   - Returns `{ name, avatar }` for IDs that are the project owner or a collaborator. Any other ID resolves to "Unknown user", so nobody can look up arbitrary Clerk users.
   - `resolveUsers` on `LiveblocksProvider` calls it, with batching and a cache.
   - Mention suggestions list the project's members.

3. **Canvas badges.** A node with unresolved threads shows a small count badge (`MessageSquare`, `bg-ai` dot) at its top-right corner. Clicking it selects the node and opens the inspector's Comments section.

4. **Inspector Comments section.** Below the node fields:
   - the node's threads (unresolved first) using `@liveblocks/react-ui` `Thread`
   - a `Composer` that creates a thread with `{ nodeId }`
   - resolve and reopen
   - Style the Liveblocks components to project tokens through their CSS variables in one scoped stylesheet. No raw colors in components.

5. **All comments panel.** A navbar Comments toggle (with a count of unresolved threads) opens a list of unresolved threads across the canvas: node label, first message, and replies count. Clicking one focuses the node (`focusElements` from spec 38). Threads whose node was deleted appear under "Detached" with their stored label.

6. **AI context.**
   - `lib/canvas-room.ts` gains `readOpenThreads(roomId)`: the first message and the replies count per unresolved thread, via the server client, capped at 50 threads / 8000 characters.
   - The spec, review, and plan prompt builders add them as a fenced "Open discussion" block.
   - Spec assembly appends them under Open Questions, with the node label.

## Scope limits

- No email or in-app notifications, no comments on edges, no free-floating canvas comments.

## Edge cases

- A node deleted with open threads: the threads stay, shown as Detached. Restoring a checkpoint that brings the node back reattaches them automatically (same `nodeId`).
- A comment author removed from the project: shown as "Former member".

## Tests

- The users route returns only project members and resolves strangers to "Unknown user".
- `readOpenThreads` caps and truncation.
- The prompt builders include the open discussion block, fenced.

## Check when done

- [ ] Threads can be created, replied to, and resolved on nodes, live for everyone.
- [ ] Badges and the all-comments panel work; detached threads are listed.
- [ ] Generated specs list open discussion under Open Questions.
- [ ] Definition of done in `context/feature-specs/README.md`.

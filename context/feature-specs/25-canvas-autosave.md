# 25 — Canvas Autosave

**Phase:** 4 · Canvas durability · **Depends on:** 21, 23 · **Unlocks:** 26, 28, 33, 41

## Goal

Keep a durable copy of every canvas outside Liveblocks, restore it into an empty room, and show users that their work is saved. The canvas JSON lives in Vercel Blob; the Prisma `Project` row stores the reference.

**The server is the only snapshot writer.** Clients signal changes; the server reads the room and writes a validated snapshot. This avoids trusting uploaded canvas state, but server requests can still race. Serialize snapshot publication per project and test that an older read can never replace a newer accepted save.

## Read first

- `prisma/models/project.prisma` (note: the path is `models`, plural): reuse `canvasJsonPath` and do not add a second URL column
- `node_modules/@liveblocks/react-flow/dist/node.d.ts`: `mutateFlow`, the server-side reader and writer for the flow. Do not pass a `storageKey`; the client's `useLiveblocksFlow` uses the default too, and the two must match.
- `lib/liveblocks.ts` (server client), `lib/project-access.ts`, `lib/api-response.ts`
- `components/editor/canvas-flow.tsx` (`CanvasFlowHandle`, `importTemplate`) and `canvas-room.tsx`
- The Vercel Blob docs for the installed `@vercel/blob` version: `put`, `del`, and whether private access is supported

## Install

- `@vercel/blob`

## Environment

- `BLOB_READ_WRITE_TOKEN` (required once this unit ships)

## Implementation

1. **Schema.** On `Project`:
   - add `canvasSavedAt DateTime?`, `canvasHash String?` (SHA-256 of canonical content, excluding `savedAt`) and `canvasRevision Int @default(0)`, the monotonic snapshot publication revision
   - replace `@@index([ownerId])` with `@@index([ownerId, createdAt])`, the composite the project list needs (an open question in `progress-tracker.md`)
   - one migration, named `canvas_autosave`

2. **`lib/canvas-room.ts` (server only).** Shared room access for everything that reads the canvas from now on:
   - `readRoomGraph(roomId)` opens the flow with `mutateFlow` without mutating, and returns `flow.toJSON()` normalized through `normalizeCanvasNode`
   - `replaceRoomGraph(roomId, graph)` removes every edge and node, then adds the new ones, inside **one** `mutateFlow` call, so collaborators receive a single update
   - both use the Liveblocks client from `lib/liveblocks.ts`

3. **`lib/canvas-snapshot.ts` (server only).**
   - The snapshot format is `{ schemaVersion: 1, savedAt, nodes, edges }`, validated by a zod `canvasSnapshotSchema` that reuses `canvasGraphSchema`.
   - `writeCanvasSnapshot(projectId)`:
     1. read the room graph
     2. validate it
     3. canonicalize persistent graph content (and, from spec 28, the brief), excluding timestamps, presence, selection and other transient UI fields; hash that content, then add `savedAt` to the serialized snapshot envelope
     4. if the hash equals `canvasHash`, return `{ changed: false }`
     5. otherwise `put` to `canvas/{projectId}/{random}.json` with private access and a new URL per save. If private access is unavailable, choose a private storage adapter before shipping; an unguessable public URL is not authorization.
     6. publish `canvasJsonPath`, `canvasHash`, `canvasSavedAt` and revision with a database-backed per-project lease and fencing/CAS check. Acquire before reading and release after publication; renew during remote calls without holding an open database transaction. A stale writer cleans up its own unreferenced blob and retries from a fresh read; it never publishes an older snapshot.
     7. best-effort `del` of the previous blob, whose failure is logged and never thrown
   - `readCanvasSnapshot(projectId)` fetches and validates the stored snapshot, or returns `null`.

4. **Routes** (all require a member):
   - `POST /api/projects/[projectId]/canvas/snapshot`, no body → `200 { changed, savedAt }`
   - `GET /api/projects/[projectId]/canvas` → `200 { savedAt, nodeCount, edgeCount } | 200 null`. Metadata only; the canvas itself stays server-side.
   - `POST /api/projects/[projectId]/canvas/restore` → restores the saved snapshot **only if the room is empty**. The emptiness check and the write happen inside the same `mutateFlow` call, so two tabs opening at once cannot double-restore. Answers `{ restored: boolean }`.

5. **`hooks/use-canvas-autosave.ts`.**
   - Exposes `{ status, lastSavedAt, markDirty, saveNow }`, where `status` is `"idle" | "saving" | "saved" | "error"`.
   - `markDirty()` is called for persistent local edits, including resize dimensions, undo/redo, import and inspector writes. Ignore selection and measurement-only dimension changes. Debounced save runs after Liveblocks confirms local storage synchronization; HTTP and WebSocket messages are not ordered together. A lifecycle beacon is best-effort, never proof of a successful final save.
   - Debounce: trailing 3 s, and a maximum wait of 20 s during continuous editing.
   - On failure: retry with backoff (2 s, 5 s, 15 s), then `error`. `saveNow()` retries immediately.
   - On `pagehide`, or `visibilitychange` to hidden, while dirty: `navigator.sendBeacon` to the snapshot route (same-origin, so the Clerk cookie is sent).

6. **Restore on open.** After storage loads, if the flow has no nodes and no edges, `CanvasFlow` calls the restore route once. On `restored: true`, fit the view when the nodes arrive. The restore is server-side, so it never lands in anyone's undo stack.

7. **Save status in the navbar.**
   - `CanvasRoom` reports status up through an `onSaveStatusChange` prop.
   - `CanvasFlowHandle` gains `saveNow()`.
   - `EditorWorkspaceShell` renders a Save button in the navbar actions: a cloud icon, "Saving…", "Saved · 2m ago", or "Save failed — Retry". Clicking it calls `saveNow()`.
   - The relative time refreshes every 30 s.

## Contracts

```ts
// lib/canvas-snapshot.ts
interface CanvasSnapshotV1 {
  schemaVersion: 1
  savedAt: string // ISO 8601
  nodes: CanvasNode[]
  edges: CanvasEdge[]
}
```

| Route | Access | Success | Errors |
| --- | --- | --- | --- |
| `POST …/canvas/snapshot` | member | `200 { changed, savedAt, revision }` | 401, 404, 422 (graph failed validation) |
| `GET …/canvas` | member | `200 { savedAt, nodeCount, edgeCount } \| null` | 401, 404 |
| `POST …/canvas/restore` | member | `200 { restored }` | 401, 404 |

- `Project` gains `canvasSavedAt`, `canvasHash`, and `canvasRevision`. A snapshot is published only when its revision is exactly one above the stored value (compare-and-set), so an older read can never replace a newer save.
- `lib/api-response.ts` gains `unprocessable_entity` → `422`.
- Blob keys: `canvas/{projectId}/{random}.json`. Update `architecture-context.md`, which currently says `canvas/{projectId}.json`.

## Scope limits

- No version history. That is spec 26.
- No Liveblocks webhooks.
- The brief joins the snapshot in spec 28, not here.

## Edge cases

- A snapshot that fails validation is not written. Return `422 unprocessable_entity` with bounded safe issues (add this shared error code here); show a persistent invalid-state error without automatic retries. The last good snapshot stays. Never label a rejected save as saved.
- Track whether the room was initialized separately from whether it contains zero nodes. Restore only an uninitialized room; an intentional empty graph or a brief-only project must not resurrect an older design. Spec 28 extends the emptiness rule to the brief.
- A room that is empty on purpose (the user deleted everything) must not be refilled on the next open. Delete-all saves an empty snapshot, and restoring an empty snapshot is a no-op.
- A project deleted while a save is in flight: the Prisma update fails with not-found; answer `404` and swallow the orphan blob (best-effort `del`).

## Tests

- `writeCanvasSnapshot`: unchanged content skips even at different times; simultaneous saves cannot publish out of order; stale writers cannot delete the currently referenced blob; invalid graphs visibly fail. Mock remote stores and add a transaction race test with an isolated database.
- Resize, undo/redo, storage-sync delay, intentional empty rooms and brief-only restore regressions.
- Route tests: 401, 404 for a non-member, 200 for a member.
- `useCanvasAutosave` (jsdom, fake timers): debounce, max wait, retry backoff, and select-only changes that do not mark dirty.

## Check when done

- [ ] Edits persist to Blob within about 3 s of the last local change; `canvasJsonPath`, `canvasHash`, and `canvasSavedAt` update.
- [ ] Multiple open clients do not produce duplicate uploads (the hash skip).
- [ ] An empty room restores from the snapshot; a non-empty room is never overwritten.
- [ ] The navbar shows saving / saved / error, and Save forces a save.
- [ ] `architecture-context.md` storage keys updated.
- [ ] Definition of done in `context/feature-specs/README.md`.

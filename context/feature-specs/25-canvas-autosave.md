# 25 — Canvas Autosave

**Phase:** 4 · Canvas durability · **Depends on:** 21, 23 · **Unlocks:** 26, 28, 33, 41

## Goal

Keep a durable copy of every canvas outside Liveblocks, restore it into an empty room, and show users that their work is saved. The canvas JSON lives in Vercel Blob; the Prisma `Project` row stores the reference.

**The server is the only writer.** Clients signal that something changed; the server reads the room's real state and writes the snapshot. A client never uploads a graph. This removes three problems at once: trusting client JSON, several clients racing each other, and snapshots that differ from what the room actually holds.

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
   - add `canvasSavedAt DateTime?` and `canvasHash String?` (the SHA-256 of the serialized snapshot)
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
     3. serialize with stable key order, then hash
     4. if the hash equals `canvasHash`, return `{ changed: false }`
     5. otherwise `put` to `canvas/{projectId}/{random}.json` with `addRandomSuffix` (a new URL per save avoids stale CDN copies of an overwritten blob), with private access when the installed version supports it
     6. update `canvasJsonPath`, `canvasHash`, and `canvasSavedAt` in one Prisma update
     7. best-effort `del` of the previous blob, whose failure is logged and never thrown
   - `readCanvasSnapshot(projectId)` fetches and validates the stored snapshot, or returns `null`.

4. **Routes** (all require a member):
   - `POST /api/projects/[projectId]/canvas/snapshot`, no body → `200 { changed, savedAt }`
   - `GET /api/projects/[projectId]/canvas` → `200 { savedAt, nodeCount, edgeCount } | 200 null`. Metadata only; the canvas itself stays server-side.
   - `POST /api/projects/[projectId]/canvas/restore` → restores the saved snapshot **only if the room is empty**. The emptiness check and the write happen inside the same `mutateFlow` call, so two tabs opening at once cannot double-restore. Answers `{ restored: boolean }`.

5. **`hooks/use-canvas-autosave.ts`.**
   - Exposes `{ status, lastSavedAt, markDirty, saveNow }`, where `status` is `"idle" | "saving" | "saved" | "error"`.
   - `markDirty()` is called only for **local** edits. `CanvasFlow` calls it from its change handlers, ignoring `select` and `dimensions` changes, and from `importTemplate` and the inspector writes. Remote edits never trigger a save from this client; whoever made them saves.
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
| `POST …/canvas/snapshot` | member | `200 { changed, savedAt }` | 401, 404 |
| `GET …/canvas` | member | `200 { savedAt, nodeCount, edgeCount } \| null` | 401, 404 |
| `POST …/canvas/restore` | member | `200 { restored }` | 401, 404 |

- Blob keys: `canvas/{projectId}/{random}.json`. Update `architecture-context.md`, which currently says `canvas/{projectId}.json`.

## Scope limits

- No version history. That is spec 26.
- No Liveblocks webhooks.
- The brief joins the snapshot in spec 28, not here.

## Edge cases

- A snapshot that fails validation (a bad edit from an old client) is **not** written. Log the issues and answer `200 { changed: false }`, so the client does not retry forever. The last good snapshot stays.
- A room that is empty on purpose (the user deleted everything) must not be refilled on the next open. Delete-all saves an empty snapshot, and restoring an empty snapshot is a no-op.
- A project deleted while a save is in flight: the Prisma update fails with not-found; answer `404` and swallow the orphan blob (best-effort `del`).

## Tests

- `writeCanvasSnapshot`: skips when the hash is unchanged; writes, updates, and deletes the old blob otherwise; refuses invalid graphs. Mock blob, Prisma, and the room reader.
- Route tests: 401, 404 for a non-member, 200 for a member.
- `useCanvasAutosave` (jsdom, fake timers): debounce, max wait, retry backoff, and select-only changes that do not mark dirty.

## Check when done

- [ ] Edits persist to Blob within about 3 s of the last local change; `canvasJsonPath`, `canvasHash`, and `canvasSavedAt` update.
- [ ] Multiple open clients do not produce duplicate uploads (the hash skip).
- [ ] An empty room restores from the snapshot; a non-empty room is never overwritten.
- [ ] The navbar shows saving / saved / error, and Save forces a save.
- [ ] `architecture-context.md` storage keys updated.
- [ ] Definition of done in `context/feature-specs/README.md`.

# 26 — Canvas Checkpoints

**Phase:** 4 · Canvas durability · **Depends on:** 25 · **Unlocks:** 33 (AI undo), 41 (import safety)

## Goal

Let teams save named points in a design's history and go back to any of them. The same mechanism makes AI edits safe: every AI run that changes the canvas checkpoints first (spec 33), so "Undo AI changes" is one click, even though server-side edits are not in anyone's local undo stack.

## Read first

- `lib/canvas-room.ts` and `lib/canvas-snapshot.ts` from spec 25: checkpoints reuse the snapshot format and the room reader and writer
- `components/editor/canvas-flow.tsx` (`importTemplate`)
- `components/editor/starter-templates-modal.tsx` and `lib/starter-templates.ts`: template import moves behind a server route (step 5)
- shadcn `dialog`, `scroll-area`, and `button` in `components/ui/`

## Implementation

1. **Model** in `prisma/models/canvas.prisma`:

   ```prisma
   enum CheckpointSource {
     MANUAL
     AI_RUN
     RESTORE
     IMPORT
   }

   model CanvasCheckpoint {
     id          String           @id @default(cuid())
     projectId   String
     label       String
     source      CheckpointSource
     blobUrl     String
     nodeCount   Int
     edgeCount   Int
     createdById String
     runId       String?          @unique // internal TaskRun ID for AI_RUN retry lookup
     createdAt   DateTime         @default(now())

     project Project @relation(fields: [projectId], references: [id], onDelete: Cascade)

     @@index([projectId, createdAt])
   }
   ```

   Add the back-relation on `Project`. Deleting a project cascades the rows. Blob cleanup for a deleted project is a best-effort `del` by prefix in the project delete handler.

2. **`lib/canvas-checkpoints.ts` (server only).**
   - `createCheckpoint(projectId, { label, source, userId })`: reads the room, stores a snapshot at `checkpoints/{projectId}/{random}.json`, creates the row, then prunes.
   - **Retention:** target 50 per project. Never prune a checkpoint referenced by an active run, pending undo or retained baseline. Prune unreferenced `AI_RUN`, `RESTORE`, and `IMPORT` before `MANUAL`; if protected records exceed the target, retain them and report retention pressure.
   - `restoreCheckpoint(projectId, checkpointId, userId)`:
     1. create a `RESTORE` checkpoint labelled "Before restoring '{label}'"
     2. `replaceRoomGraph` with the checkpoint's graph
     3. `writeCanvasSnapshot`
     4. return the new checkpoint's ID, so a restore can itself be undone
   - `listCheckpoints(projectId)`: newest first, with the author's display name resolved through the existing Clerk lookup helpers.

3. **Routes** (member unless noted):
   - `GET /api/projects/[projectId]/checkpoints` → `{ checkpoints: CheckpointSummary[] }`
   - `POST /api/projects/[projectId]/checkpoints` with `{ label }` (1–80 chars) → `201 { checkpoint }`
   - `POST /api/projects/[projectId]/checkpoints/[checkpointId]/restore` → `200 { restoredFrom, undoCheckpointId }`
   - `DELETE /api/projects/[projectId]/checkpoints/[checkpointId]`: owner, or the checkpoint's creator → `204`
   - `POST /api/projects/[projectId]/canvas/import-template` with `{ templateId, expectedRevision }` → `200 { checkpointId, revision }`. An unknown template ID answers `400`; a stale `expectedRevision` answers `409`.
   - A checkpoint ID that belongs to another project answers `404`.

4. **History UI.**
   - A History button (clock icon) in the navbar opens `components/editor/canvas-history-dialog.tsx`:
     - a "Save checkpoint" input and button at the top
     - a scrollable list: label, source badge (Manual / AI / Restore / Import), author, relative time, node and edge counts
     - Restore opens a confirm step: "Everyone in this room will see the canvas change. You can undo this from History." The dialog closes after a successful restore and the canvas fits its view.
   - Loading, empty ("No checkpoints yet"), and error states follow the share dialog's error pattern.

5. **Template import safety.** Move destructive template replacement to an authenticated server route accepting only a known template ID and expected graph revision. Resolve trusted template data server-side; capture checkpoint and perform the conditional replace as one serialized logical operation. The client fits the resulting view after success. A checkpoint request followed by an unconditional client write does not protect concurrent edits.

## Contracts

```ts
interface CheckpointSummary {
  id: string
  label: string
  source: "MANUAL" | "AI_RUN" | "RESTORE" | "IMPORT"
  nodeCount: number
  edgeCount: number
  createdAt: string
  author: { id: string; name: string; avatar: string }
}

// POST /api/projects/[projectId]/canvas/import-template
interface ImportTemplateRequest {
  templateId: string       // must name a template in lib/starter-templates.ts
  expectedRevision: number // the graph revision the client last saw
}
interface ImportTemplateResponse {
  checkpointId: string | null // null when the canvas was empty, so nothing needed saving
  revision: number
}
```

How the room's graph revision is read and compared is settled by the collaboration-atomicity open question in `progress-tracker.md` before this route is built.

## Scope limits

- No visual diff between checkpoints.
- No automatic time-based checkpoints. Autosave covers durability; checkpoints are deliberate points.
- The brief joins checkpoints in spec 28.

## Edge cases

- Concurrent restores/imports use the expected revision and serialized mutation protocol. One stale request returns 409; it must not overwrite changes made after its checkpoint read. Validate the installed Liveblocks API's conditional/transaction semantics before claiming atomicity. If it cannot enforce this, block replacement and expose a proposal instead.
- Restoring while an AI run is active answers `409 conflict` once spec 31 exists. Leave a `TODO(spec-31)` at the check site; do not stub the run lookup now.
- A checkpoint whose blob is missing: the restore answers `404` with "This checkpoint's data is no longer available", and the list still shows the row.

## Tests

- Retention prunes non-manual checkpoints first and never deletes the one just created.
- `restoreCheckpoint` creates the undo checkpoint **before** replacing the graph (assert call order).
- Route tests: cross-project checkpoint ID → 404; delete by a non-owner non-creator → 403.
- Template import route: unknown template → 400; stale `expectedRevision` → 409 with the graph untouched; success checkpoints a non-empty canvas before replacing it.

## Check when done

- [ ] Checkpoints can be saved, listed, restored, and deleted from the History dialog.
- [ ] Every restore is itself undoable.
- [ ] Template import runs through the server route: a non-empty canvas is checkpointed first, and a stale revision is refused.
- [ ] `architecture-context.md` lists the `checkpoints/` Blob prefix and the model.
- [ ] Definition of done in `context/feature-specs/README.md`.

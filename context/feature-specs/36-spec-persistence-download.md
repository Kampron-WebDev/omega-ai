# 36 — Spec Persistence and Download

**Phase:** 6 · Specification · **Depends on:** 35 · **Unlocks:** 37, 39, 40, 46

## Goal

Keep every generated spec. Store the Markdown in Vercel Blob and the metadata in Prisma, and serve list, content, download, and delete through access-checked routes. The browser never sees a Blob URL.

## Read first

- `lib/canvas-snapshot.ts`: follow the same Blob pattern (random suffix, private access if supported, best-effort delete)
- `trigger/generate-spec.ts`, `lib/project-access.ts`, `lib/projects.ts` (`findOwnedProject`)

## Implementation

1. **Model** in `prisma/models/spec.prisma`:

   ```prisma
   model ProjectSpec {
     id          String   @id @default(cuid())
     projectId   String
     title       String
     filePath    String   // Blob URL, never sent to clients
     sizeBytes   Int
     runId       String?  @unique
     createdById String
     createdAt   DateTime @default(now())

     project Project @relation(fields: [projectId], references: [id], onDelete: Cascade)

     @@index([projectId, createdAt])
   }
   ```

   This closes the cascade and index open question for `ProjectSpec`.

2. **`lib/project-specs.ts`** (server only).
   - `saveProjectSpec({ projectId, title, markdown, runId, userId })` puts the file at `specs/{projectId}/{random}.md` (content type `text/markdown; charset=utf-8`), then creates the row. If the row insert fails, it deletes the blob.
   - `listProjectSpecs(projectId)`: newest first, metadata plus author name.
   - `readProjectSpec(projectId, specId)`: the row plus its content. A row from another project returns `null`.
   - `deleteProjectSpec(projectId, specId)`: deletes the row, then the blob best-effort.

3. **The task persists.** `trigger/generate-spec.ts` calls `saveProjectSpec` after assembly and returns `{ specId, title }`. `runId @unique` keeps a retried task idempotent: on a unique conflict, reuse the existing row. The completed status text is "Spec ready: {title}". The assistant posts to chat: "I generated **{title}**. Open it in the Specs tab."

4. **Routes** (member unless noted):
   - `GET /api/projects/[projectId]/specs` → `{ specs: SpecSummary[] }`
   - `GET /api/projects/[projectId]/specs/[specId]` → `{ spec: SpecSummary, markdown }`
   - `GET /api/projects/[projectId]/specs/[specId]/download` → the file, with:
     - `Content-Type: text/markdown; charset=utf-8`
     - `Content-Disposition: attachment; filename="{slug}-spec-{yyyy-mm-dd-HHmm}.md"`, with an RFC 5987 `filename*` for non-ASCII names
     - `Cache-Control: private, no-store`
   - `DELETE /api/projects/[projectId]/specs/[specId]`: the owner or the spec's creator → `204`.
   - Missing, foreign, or not-a-member all answer `404` (workspace-read semantics). A member who is neither the owner nor the creator gets `403` on delete.

5. **Project delete.** When a project is deleted, also delete its `specs/{projectId}/` and `checkpoints/{projectId}/` Blob prefixes best-effort, and log the counts.

## Contracts

```ts
interface SpecSummary {
  id: string
  title: string
  sizeBytes: number
  createdAt: string
  author: { id: string; name: string }
}
```

## Scope limits

- No UI (spec 37), no editing, no diffing, no sharing outside the project.
- Spec content is never stored in Prisma.

## Edge cases

- The blob is missing for an existing row: content and download answer `404` with "This spec's file is no longer available"; the list still shows the row, and it can be deleted.
- A title with slashes or quotes produces a safe filename (reuse `slugify`).

## Tests

- `saveProjectSpec` deletes the blob when the insert fails.
- Download headers, including the `filename*` encoding.
- Access matrix: owner, collaborator, stranger, cross-project spec ID.
- Task idempotency on `runId`.

## Check when done

- [ ] Generated specs persist and survive a reload.
- [ ] Download produces a correctly named `.md` attachment.
- [ ] No response body or header contains a Blob URL.
- [ ] `architecture-context.md` storage section updated.
- [ ] Definition of done in `context/feature-specs/README.md`.

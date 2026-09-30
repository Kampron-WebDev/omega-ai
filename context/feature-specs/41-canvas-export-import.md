# 41 — Canvas Export and Import

**Phase:** 6 · Handoff · **Depends on:** 25, 26, 28, 35 · **Unlocks:** 43

## Goal

Get designs out of Omega and into documents, READMEs, and slides (PNG, SVG, Mermaid, JSON), and bring a JSON design back in, safely. Mermaid comes from the same serializer the spec uses, so a README diagram always matches the spec.

## Read first

- React Flow's "download image" example for the installed `@xyflow/react` version (`getNodesBounds`, `getViewportForBounds`)
- `lib/canvas-mermaid.ts`, `lib/canvas-snapshot.ts`, `lib/canvas-checkpoints.ts`, `lib/canvas-room.ts`
- `components/editor/editor-workspace-shell.tsx` (navbar actions)

## Install

- `html-to-image`, at the version the React Flow example uses
- shadcn `dropdown-menu` through the CLI, if it is not present yet

## Implementation

1. **Export menu.** A navbar "Export" dropdown in the workspace:
   - **PNG** (2× pixel ratio) and **SVG**: render the React Flow viewport around the bounds of all nodes with 48 px padding, on the canvas background color. Filter out controls, the minimap, the shape panel, the inspector, cursors, and presence. File name `{slug}-{yyyy-mm-dd}.png|svg`.
   - **Mermaid**: "Copy Mermaid" (clipboard, using the existing `useCopyToClipboard`) and "Download .mmd".
   - **JSON**: download the v2 snapshot (nodes, edges, brief) through `GET /api/projects/[projectId]/canvas/export` (member). The server reads the room, so what is exported is exactly what is stored.
   - Each item is disabled on an empty canvas.

2. **Import JSON.** "Import JSON…" in the same menu opens a file picker for `.json` up to 2 MB.
   - `POST /api/projects/[projectId]/canvas/import` (member), body = the snapshot.
     1. validate it with `canvasSnapshotSchema` (v1 or v2) and `CANVAS_LIMITS`
     2. answer `409` if an AI run is active
     3. create an `IMPORT` checkpoint ("Before importing {filename}")
     4. `replaceRoomGraph`, plus the brief when the file carries one
     5. `writeCanvasSnapshot`
   - A validation failure answers `400` with the first five readable issues, shown in the dialog.
   - Success fits the view and posts a system chat message: "{name} imported a design from {filename}".

3. **Body size.** Bound bytes while reading the request stream before JSON parsing; reject over 2 MB with 413 even when `Content-Length` is missing or false. Add `payload_too_large` centrally. Apply the spec 26 expected-revision and serialized checkpoint/replacement protocol to prevent races with human edits and imports.

## Scope limits

- No Mermaid, draw.io, or Excalidraw import (backlog), and no PDF export.
- The template modal keeps its own import path.

## Edge cases

- Nodes whose images are not loaded yet: wait for fonts (`document.fonts.ready`) before capturing.
- An imported file with node IDs colliding with nothing is fine. Import replaces the canvas, it does not merge.
- A legacy file without `kind` normalizes to `generic`.

## Tests

- Import route: 413, 400 with issues, 409 while busy, checkpoint created before the replace, the brief restored from v2.
- The PNG and SVG export filter excludes the listed UI layers (unit-test the filter function).

## Check when done

- [ ] All four export formats produce correct files; the Mermaid output matches the spec's diagram.
- [ ] JSON round-trips: export, then import, gives an identical canvas and brief.
- [ ] Import is undoable from History.
- [ ] Definition of done in `context/feature-specs/README.md`.

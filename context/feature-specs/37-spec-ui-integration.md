# 37 — Specs Tab

**Phase:** 6 · Specification · **Depends on:** 36 · **Unlocks:** 39, 40

## Goal

Turn the Specs tab's static demo (spec 20) into the working home for generated specs: generate one (with an optional focus), watch it progress with the rest of the room, then list, preview, copy, download, and delete specs.

## Read first

- `components/editor/ai-specs-tab.tsx` (demo card to replace), `ai-sidebar.tsx`, `hooks/use-ai-status.ts`, `hooks/use-ai-run.ts`
- `lib/api-client.ts` (`requestJson`): the only fetch path for client code
- shadcn `dialog`, `scroll-area`, and `button`

## Install

- `react-markdown` and `remark-gfm` (tables). No `rehype-raw`: raw HTML in generated Markdown must never render.

## Implementation

1. **Client API: `lib/spec-api.ts`.** `listSpecs`, `getSpec`, `deleteSpec`, `generateSpec(roomId, focus?)`, all through `requestJson`. Download is a plain link to the download route.

2. **`hooks/use-project-specs.ts`.**
   - Loads the list on mount.
   - Refetches when `useAiStatus().latest` becomes `completed` with `task === "spec"`, so every collaborator's list updates, not only the requester's.
   - Exposes `{ specs, isLoading, error, refresh, remove }`.

3. **Generate.**
   - A "Generate Spec" button (`bg-ai text-white`) with an optional "Focus (optional)" disclosure. The disclosure holds a one-line input, for example "Emphasize the payments flow".
   - Disabled while the room is busy, with the same 409 and 429 messages as the composer.
   - The status strip (spec 29) is shown in this tab too, so progress is visible without switching tabs.

4. **List.**
   - Compact rows, newest first: file icon, title, "{author} · {relative time}", and size.
   - Row actions: Download (a link) and a More menu with Copy Markdown and Delete (Delete for the owner or creator only).
   - Empty state: "No specs yet. Generate one from the current design." Error state with Retry.

5. **Preview dialog: `components/editor/spec-preview-dialog.tsx`.**
   - Large dialog (`max-w-3xl`, `rounded-3xl`), fetched on open, with a loading skeleton.
   - Rendered with `react-markdown` and `remark-gfm`, through a component map styled with project tokens:
     - headings in `text-copy-primary`
     - body in `text-copy-secondary`
     - tables with `border-border-default`
     - code blocks on `bg-bg-elevated` in Geist Mono
     - Mermaid blocks as code with a "Copy diagram" button (rendering them is backlog)
   - Header actions: Copy Markdown, Download, Close. Escape closes; focus returns to the row.
   - The content is held only while the dialog is open (no global state).

6. **Delete.** A confirm step, then an optimistic removal with rollback on error.

7. **Chat bubbles render Markdown.** Switch assistant bubbles (spec 30) to the same safe `react-markdown` renderer, with a compact component map.

## Scope limits

- No spec editing, no Mermaid rendering, no backend changes beyond what spec 36 built.
- Do not store spec content beyond the dialog's lifetime.

## Edge cases

- The spec was deleted by someone else while the preview is open: show "This spec was deleted" and remove it from the list.
- A very long spec (100 KB) scrolls smoothly inside `ScrollArea`. Do not render it twice.

## Tests

- `useProjectSpecs` refetches on a completed spec status and ignores other task kinds.
- The Markdown renderer does not render raw HTML (`<img onerror>` stays text).
- Delete rolls back on failure.

## Check when done

- [ ] The demo card is gone. Generate, list, preview, copy, download, and delete all work.
- [ ] A collaborator's list updates when someone else's spec completes.
- [ ] Assistant chat messages render Markdown safely.
- [ ] Definition of done in `context/feature-specs/README.md`.

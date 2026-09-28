# 43 — Command Palette and Shortcut Help

**Phase:** 7 · Collaboration depth · **Depends on:** 27, 37, 38, 41 · **Unlocks:** —

## Goal

Developers live on the keyboard. `⌘K` / `Ctrl+K` opens a palette that reaches every workspace action and finds any node by name. `?` opens a sheet listing every shortcut. Everything already exists; this unit makes it fast to reach.

## Read first

- `hooks/use-keyboard-shortcuts.ts` (`isEditableTarget`), `components/editor/canvas-flow.tsx` (`CanvasFlowHandle`: `importTemplate`, `saveNow`, `tidyUp`, `focusElements`), `editor-workspace-shell.tsx`
- shadcn `command` docs

## Install

- shadcn `command` through the CLI (it brings `cmdk`)

## Implementation

1. **Command registry: `lib/commands.ts`** (pure types plus helpers).
   - `Command = { id, title, group, keywords?, shortcut?, run(ctx), isEnabled?(ctx) }`.
   - The workspace builds its command list from a context object (handles, setters, room state). No global store.

2. **Groups and commands:**

   | Group | Commands |
   | --- | --- |
   | Canvas | Fit view, Zoom in, Zoom out, Tidy up, Undo, Redo, Save now |
   | Nodes | "Go to node…", a live list of nodes by label, kind, and technology; selecting one runs `focusElements` |
   | AI | Ask Ghost AI…, Generate spec, Run review, Generate build plan |
   | Project | Brief, History, Share, Templates, Export PNG / SVG / Mermaid / JSON, Import JSON |
   | Navigate | Switch project…, from the owned and shared lists |
   | Help | Keyboard shortcuts |

   - "Ask Ghost AI…" opens the AI sidebar with the composer focused and the palette's typed text as the draft.
   - Commands that start AI runs respect the busy state (`isEnabled`) and show the reason.

3. **Palette UI: `components/editor/command-palette.tsx`.** Uses shadcn `CommandDialog`, token-styled, grouped, shows shortcuts on the right, and fuzzy-matches titles and keywords. Opens on `⌘K` / `Ctrl+K` **even inside inputs**, since that is the expected convention. Escape closes and returns focus.

4. **Shortcut sheet.** `?` (outside editable fields) opens a dialog listing every shortcut, generated from the same registry, so it can never drift.

5. **Discoverability.** A small "⌘K" hint button in the navbar (showing "Ctrl K" on non-Apple platforms).

## Scope limits

- No user-customizable shortcuts and no palette on the `/editor` home page.

## Edge cases

- `⌘K` while a dialog is open: ignored, so modals are never stacked.
- A node list of 300 items stays responsive. Use `cmdk`'s built-in filtering; do not re-render the canvas.

## Tests

- The registry: disabled commands carry a reason; the shortcut sheet lists every command that has a shortcut.
- The key handler: `⌘K` opens from inside an input; `?` does not fire inside an input.

## Check when done

- [ ] Every listed command works from the palette.
- [ ] "Go to node" finds and focuses nodes.
- [ ] The shortcut sheet matches the real shortcuts.
- [ ] Definition of done in `context/feature-specs/README.md`.

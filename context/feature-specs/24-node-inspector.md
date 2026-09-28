# 24 — Node and Edge Inspector

**Phase:** 4 · Canvas durability · **Depends on:** 23 · **Unlocks:** 38, 42

## Goal

Let people edit what a component *is*, not only what it looks like. A floating inspector shows the one selected node or edge and edits its label, kind, technology, and description (for a node), or its label, protocol, and sync/async mode (for an edge). A well-described graph is what makes the generated spec, review, and build plan good.

## Read first

- `components/editor/canvas-flow.tsx`: `updateNodeData` and `updateEdgeData` are the only write paths. The inspector uses them.
- `components/editor/canvas-node-color-toolbar.tsx`: the existing floating-control style
- `components/editor/canvas-edge.tsx`: the edge label edit that commits on finish (the inspector's text inputs behave the same way)
- `hooks/use-keyboard-shortcuts.ts`: `isEditableTarget` already protects inputs from canvas shortcuts
- `types/canvas.ts` and `lib/canvas-schema.ts` from spec 23

## Install

- shadcn `select` through the shadcn CLI (`npx shadcn@latest add select`). Do not hand-write it. Check it uses `@base-ui/react` like the other components in `components/ui/`.

## Implementation

1. **Selection source.** Use React Flow's `useOnSelectionChange` inside the flow to track the selected node and edge IDs. The inspector opens only when exactly one element is selected in total (one node and nothing else, or one edge and nothing else).

2. **`components/editor/canvas-inspector.tsx`.**
   - Floating panel inside the canvas: `absolute top-4 left-4 z-10 w-72`, `rounded-2xl`, `bg-bg-surface/95`, `border-border-default`, shadow, and `backdrop-blur`. It sits under the project sidebar overlay (`z-40`).
   - Header: kind icon, "Component" or "Connection", and a close button that clears the selection.
   - **Node fields:**
     - Label
     - Kind (`Select`, with each kind's icon and label)
     - Technology (input, placeholder "e.g. PostgreSQL 16")
     - Description (auto-growing textarea, up to `CANVAS_LIMITS.maxDescription`, with a remaining-character hint near the limit)
   - **"Apply kind style"** button: sets shape and color to the kind's defaults. Changing the kind never silently restyles a node.
   - **Edge fields:**
     - Label
     - Protocol (`Select`, plus "None")
     - Mode (two-option segmented control: Sync / Async)
     - Read-only "From → To" line using the node labels
   - Text fields keep a local draft and commit on blur, on Enter (single-line fields), or on Escape. Selects and toggles commit immediately. This matches the edge label decision in `progress-tracker.md`.
   - Enforce the length limits in the inputs (`maxLength`), so what a user types always passes `parseCanvasGraph`.

3. **Wiring.** `CanvasFlow` renders `CanvasInspector` and passes the selected element plus `updateNodeData` / `updateEdgeData`. The inspector never imports Liveblocks directly.

4. **Collaboration.** If another user changes a field while the inspector is open, fields without a local draft update live. A field being edited keeps the draft until it commits (last writer wins, same as the rest of the canvas). If the selected element is deleted by someone else, the inspector closes.

## Scope limits

- No multi-select editing.
- No comments section. Spec 42 adds it to this panel.
- Do not move the color toolbar. The inspector does not duplicate color and shape pickers beyond "Apply kind style".

## Edge cases

- Delete and Backspace inside inspector fields must not delete the node. Verify that React Flow's `deleteKeyCode` ignores inputs, and guard it if it does not.
- Selecting a different node while a draft is uncommitted commits the draft to the **original** node first.
- An inspector opened on a legacy node (no `kind`) shows "Generic".

## Tests

- jsdom: draft commit on blur, Enter, and Escape; commit targets the original element when the selection changes mid-edit; `maxLength` enforced.
- The selection rule: exactly one element opens the inspector; zero or two elements close it.

## Check when done

- [ ] Selecting one node or edge opens the inspector; anything else closes it.
- [ ] All fields write through `updateNodeData` / `updateEdgeData` and sync to other users.
- [ ] Typing in the inspector never triggers canvas shortcuts or deletes elements.
- [ ] "Apply kind style" restyles; changing kind alone does not.
- [ ] Definition of done in `context/feature-specs/README.md`.

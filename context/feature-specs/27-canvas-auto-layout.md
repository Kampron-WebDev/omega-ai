# 27 — Canvas Auto-Layout

**Phase:** 4 · Canvas durability · **Depends on:** 23 · **Unlocks:** 33 (AI placement), 43

## Goal

Give the canvas a deterministic layout engine, and give users a "Tidy up" action built on it. The design agent (spec 33) depends on this. **The model never invents coordinates**: it decides *what* the architecture is, and this engine decides *where* things go. That keeps AI output readable and makes placement testable.

## Read first

- `types/canvas.ts`: nodes use `origin: [0.5, 0.5]`, so `position` is the node's **center**
- `components/editor/canvas-controls.tsx`: the Tidy up button goes here
- `components/editor/canvas-flow.tsx`: `importTemplate` shows the one-batch, one-undo write pattern
- `hooks/use-keyboard-shortcuts.ts`
- The elkjs README for the installed version (layered algorithm options)

## Install

- `elkjs`. Import the bundled build (`elkjs/lib/elk.bundled.js`) so the same code runs in the browser and in a Trigger.dev task, with no web worker.

## Implementation

1. **`lib/canvas-layout.ts`**: pure, async, no React and no Liveblocks.
   - `layoutCanvas(graph, options?)`:
     - ELK `layered` algorithm, direction `RIGHT` by default (`DOWN` optional)
     - node sizes from each node's `width` / `height`, falling back to `DEFAULT_NODE_SIZES[shape]`
     - spacing: 80 px between layers, 48 px between nodes
     - returns `Map<nodeId, { x, y }>` as **center** coordinates (convert from ELK's top-left)
     - disconnected components are packed side by side, not stacked on top of each other
   - `placeNewNodes(existing, added, edges)`: positions only the added nodes and never moves existing ones.
     - The anchor is the average position of each new node's already-placed neighbors. With no placed neighbor, the anchor is just right of the existing bounding box.
     - From the anchor, search a grid (cell = the largest default node size + 48 px) in a deterministic spiral for the first cell that overlaps nothing, including nodes placed earlier in the same call.
     - Added nodes connected to each other are laid out together with `layoutCanvas` as a cluster, then the cluster is placed as one block.
   - Both functions are deterministic: the same input gives the same output, with no `Math.random` and no time dependence.

2. **Tidy up.**
   - Canvas controls gain a "Tidy up" button (`LayoutGrid` icon, tooltip "Tidy up layout (Shift+L)").
   - The `Shift+L` shortcut is added to `useKeyboardShortcuts`.
   - Applying a layout is one `room.batch` of position `replace` changes, so it is a single undo step, followed by `fitView` with the existing zoom duration.
   - The action is disabled when the canvas has fewer than two nodes.

3. **Handle.** `CanvasFlowHandle` gains `tidyUp()` for spec 43's command palette.

## Scope limits

- No layout of a selection only, no edge routing changes (edges stay smooth-step), and no direction picker in the UI.
- Templates keep their hand-authored positions.

## Edge cases

- Graphs with cycles lay out without throwing.
- 300 nodes (the `CANVAS_LIMITS` maximum) lay out in under 1 s in Node. Measure it in a test with a generous bound, so CI catches a regression, not jitter.
- Nodes with no measured size yet use the defaults.

## Tests

- No two nodes overlap after `layoutCanvas`, for a template, a cyclic graph, and a disconnected graph.
- `placeNewNodes` never moves an existing node, never overlaps, and puts a new node next to its neighbor.
- Determinism: two runs produce the same output.
- Empty graph and single-node graph.

## Check when done

- [ ] `lib/canvas-layout.ts` is pure, tested, and runs in Node.
- [ ] Tidy up (button and `Shift+L`) rearranges the canvas as one undo step for everyone.
- [ ] Definition of done in `context/feature-specs/README.md`.

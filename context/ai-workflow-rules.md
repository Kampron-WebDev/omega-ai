# Development Workflow

## Approach

Build this project incrementally using a spec-driven workflow. Context files define what to build, how to build it, and what the current state of progress is. Always implement against these specs — do not infer or invent behavior from scratch.

Specs live in `context/feature-specs/` and are built strictly in numeric order. `context/feature-specs/README.md` holds the roadmap, the shared conventions every spec relies on, the spec template, and the definition of done. Read it before starting any spec.

## Starting a Unit

1. Read the Current Goal in `progress-tracker.md` and open that spec.
2. Confirm every spec in its **Depends on** line is marked complete. If one is not, stop and say so.
3. Read the files in the spec's **Read first** section, and check library APIs against the installed versions in `node_modules`. A spec's claim that something is "already installed" or "already configured" is unverified until checked.
4. Implement, then verify with the definition of done.

## Scoping Rules

- Work on one feature unit or subsystem at a time.
- Prefer small, verifiable increments over large speculative changes.
- Do not combine unrelated system boundaries in a single implementation step.

## When To Split Work

Split an implementation step if it combines:

- UI changes and background task changes
- Real-time canvas state and database persistence
- Multiple unrelated API routes
- Behavior that is not clearly defined in the context files

If a change cannot be verified end to end quickly, the scope is too broad — split it.

## Handling Missing Requirements

- Do not invent product behavior that is not defined in the context files.
- If a requirement is ambiguous, resolve it in the relevant context file before implementing.
- If a requirement is missing, add it as an open question in `progress-tracker.md` before continuing.

## Protected Foundation Components

Do not modify generated third-party foundation components unless explicitly instructed.

This includes:

- `components/ui/*` (shadcn/ui components)
- third-party library internals

These should remain default and reusable.

Project-specific styling, layout changes, and feature logic must be implemented in app-level components instead of modifying foundation components.

Only modify these files when a task explicitly requires it.

## Keeping Docs In Sync

Update the relevant context file whenever implementation changes:

- System architecture or boundaries
- Storage model decisions
- Code conventions or standards
- Feature scope

Progress state must reflect the actual state of the implementation, not the intended state.

## Before Moving To The Next Unit

1. The current unit works end to end within its defined scope.
2. `npm run lint`, `npm run typecheck`, `npm test`, and `npm run build` pass (from spec 21 onward).
3. No invariant defined in `architecture-context.md` was violated.
4. `progress-tracker.md` reflects the completed work, what was and was not verified, and any decision that departed from the spec's wording.
5. The spec's **Check when done** list is satisfied, or each unchecked item is explained in the tracker.

## Changing the Roadmap

- New work gets a spec in the template from `context/feature-specs/README.md` before it is built.
- Insert new specs at the end, or renumber the specs that are not yet built and update every reference in `progress-tracker.md` and the README roadmap. Never renumber a completed spec.

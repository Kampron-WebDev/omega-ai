# 28 — Project Brief

**Phase:** 4 · Planning · **Depends on:** 20, 25, 26 · **Unlocks:** 33, 35, 38, 39, 40

## Goal

Planning comes before diagrams. The brief is a shared, collaboratively edited requirements document: the problem, users, goals, non-goals, functional and non-functional requirements, constraints, and open questions. Every AI task reads it as context. It is the difference between "design an e-commerce backend" and a design that fits *this* team's scale, budget, compliance, and stack.

## Read first

- `liveblocks.config.ts`: this unit declares `Storage` for the first time
- `components/editor/ai-sidebar.tsx`: the Brief tab is added here
- `lib/canvas-snapshot.ts` and `lib/canvas-checkpoints.ts`: the snapshot format gains the brief
- Liveblocks docs for `LiveObject`, `useStorage`, `useMutation`, and `RoomProvider`'s `initialStorage`

## Implementation

1. **Shape and helpers: `lib/project-brief.ts`** (shared by client and server).
   - `BRIEF_SECTIONS`: an ordered list of `{ id, title, placeholder, hint }`:

     | id | Title | Hint |
     | --- | --- | --- |
     | `summary` | Summary | One or two sentences: what is being built |
     | `problem` | Problem | The pain today, and for whom |
     | `users` | Users & roles | Who uses it and how many |
     | `goals` | Goals | Measurable outcomes |
     | `nonGoals` | Non-goals | What is explicitly out |
     | `functional` | Functional requirements | The key capabilities |
     | `nonFunctional` | Non-functional requirements | Scale, latency, availability, security, compliance |
     | `constraints` | Constraints | Stack preferences, budget, deadlines, team size |
     | `openQuestions` | Open questions | What is still undecided |

   - `ProjectBrief`: one string per section, each at most 4000 characters, Markdown allowed. Validated by a zod `projectBriefSchema`.
   - `EMPTY_BRIEF`, `briefCompletion(brief)` (filled sections out of total), and `briefToMarkdown(brief)`, which skips empty sections and is used by every AI prompt and export.

2. **Storage.**
   - `liveblocks.config.ts` declares `Storage` with `brief: LiveObject<ProjectBrief>`.
   - `RoomProvider` gets `initialStorage` with `brief: new LiveObject(EMPTY_BRIEF)`, so existing rooms gain the key on first open.
   - Verify that declaring `Storage` does not break `useLiveblocksFlow`'s typing. If it does, record the workaround under Architecture Decisions.
   - Section edits go through a `useMutation` that sets **one field**. Two people editing different sections never conflict; editing the same section is last writer wins.

3. **Brief tab.** In the AI sidebar, add a **Brief** tab between AI Architect and Specs:
   - A completion line at the top: "4 of 9 sections filled", with a thin progress bar in `bg-ai`.
   - One card per section: title, hint, and an auto-growing textarea (the same resize approach as `ai-chat-composer.tsx`).
   - Local draft, written to storage 600 ms after typing stops and on blur. A remote update applies only when the field has no unsaved local draft.
   - A character counter appears within 10% of the limit.
   - "Copy as Markdown" button (`briefToMarkdown`).

4. **Persistence.**
   - The snapshot format becomes `schemaVersion: 2`, `{ schemaVersion, savedAt, nodes, edges, brief }`. The reader accepts v1 (brief = `EMPTY_BRIEF`).
   - `lib/canvas-room.ts` gains `readRoomBrief(roomId)` (via `liveblocks.getStorageDocument(roomId, "json")`, validated) and a brief write, used by restore.
   - Autosave marks dirty on brief edits.
   - Restore-if-empty and checkpoint restore bring back the brief together with the canvas.
   - Checkpoints store v2 snapshots. A checkpoint restore replaces the brief too; the confirm text says so.

## Scope limits

- No AI drafting of the brief. The design agent reads it but does not write it.
- No rich-text editor. Plain textareas with Markdown.
- Do not sync the brief into `Project.description`.

## Edge cases

- A v1 snapshot restores an empty brief. It must never fail validation.
- Pasting more than 4000 characters truncates with a visible notice; it is never silently dropped.
- A room created before this unit gets the `brief` key from `initialStorage` without touching the flow key.

## Tests

- `briefToMarkdown`: skips empty sections, keeps order, escapes nothing it should not.
- The snapshot reader accepts v1 and v2; the v2 writer includes the brief.
- `briefCompletion` counts only non-blank sections.

## Check when done

- [ ] The Brief tab edits sync live between two sessions.
- [ ] The brief survives snapshot restore and checkpoint restore.
- [ ] `briefToMarkdown` exists for spec 33's prompt context.
- [ ] `architecture-context.md` documents the `brief` storage key and snapshot v2.
- [ ] Definition of done in `context/feature-specs/README.md`.

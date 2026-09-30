# 47 — Requirements, Discovery and Decisions

**Phase:** 8 · **Depends on:** 28, 34, 46 · **Unlocks:** 48, 49, 50, 55

## Goal

Turn a rough idea into explicit, traceable requirements through either conversation with a human or bounded autonomous discovery. Keep questions, assumptions and decisions durable instead of burying them in chat.

## Read first

- `context/agentic-platform-contracts.md` and the roadmap release gates.
- `lib/project-brief.ts`, `lib/liveblocks-feeds.ts`, `lib/trigger-runs.ts`, `types/tasks.ts`.

## Install

Use existing dependencies unless this spec names a capability needing a maintained package. Verify installed APIs before selection; record new packages and reasons.

## Environment

None beyond the dependencies' existing configuration. Any optional integration must remain disabled until its configuration is validated.

## Implementation

1. Create `types/requirements.ts`, `lib/requirements.ts`, `lib/decisions.ts` and `prisma/models/requirements.prisma`. Store stable requirement IDs, revision, source references, priority, release, acceptance criteria, risk and status. Store Decision and Question records with alternatives, rationale, owner and blocking flag. Acceptance criteria describe observable behavior and failure cases.

2. Add `/requirements`, `/questions` and `/decisions` CRUD routes using the shared contract. Writes create revisions with optimistic concurrency. Preserve accepted and superseded decisions; deleting a referenced requirement requires an explicit defer/supersede operation.

3. Add `trigger/discover-requirements.ts` and pure prompts in `lib/ai/prompts/discovery.ts`. Extract proposals from the brief and server-authenticated conversation; ask at most three focused questions per round, ordered by impact. Separate supplied facts, inferred assumptions and unknowns. The owner chooses decisions that need approval; routine assumptions may be preauthorized later by spec 55.

4. Build `components/editor/requirements-panel.tsx`: coverage list, editable acceptance criteria, question inbox, alternatives and decision history. Structured requirements become canonical when accepted; the brief is a summary and is never silently rewritten over a human draft.

5. Introduce the shared 422 error and extend task kinds/status renderers for discovery. A missing nonblocking preference can remain a labelled assumption; missing credentials, conflicting requirements or unknown critical constraints cannot be invented.

## Contracts

`Requirement { id, revision, kind: functional|quality|constraint, statement, priority, sourceRefs, acceptanceCriteria[], status: proposed|accepted|deferred|superseded }`. `Question { id, requirementIds, blocking, status, answer? }`. `/discovery` POST returns 202. Decisions contain `authority: human|policy` and the policy revision when applicable. Shared access, pagination, revision, storage and error rules apply.

## Scope limits

No code generation, repository writes or automatic acceptance of critical assumptions. Do not require a nonempty canvas to start discovery.

## Edge cases

Two people answer the same question; a changed answer invalidates dependent proposals; a repeated discovery task must not duplicate requirements.

## Tests

Exercise an ambiguous brief, incompatible latency/budget constraints, a deleted source and concurrent answer edits. Check source preservation and that draft assumptions never appear as user-confirmed facts. Include the shared authorization and concurrency checks.

## Check when done

- [ ] An idea produces editable requirements and focused questions without requiring a diagram.
- [ ] Every accepted requirement has stable acceptance IDs; unresolved blockers prevent readiness.
- [ ] Definition of done and relevant release gate; record implementation slices and observed evidence in the tracker.


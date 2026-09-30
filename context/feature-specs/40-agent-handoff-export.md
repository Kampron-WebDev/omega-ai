# 40 — Agent Handoff Export

**Phase:** 6 · Handoff · **Depends on:** 35, 36, 39 · **Unlocks:** 46

## Goal

One click produces a zip that turns an empty folder into a repository ready for a coding agent: `AGENTS.md`, `CLAUDE.md`, a `context/` folder (overview, architecture, standards, workflow rules, progress tracker, the technical spec, the diagram), and numbered feature specs. A developer unzips it, opens Claude Code or Cursor, types "continue", and the agent starts building unit 1. This is the same workflow this repository uses.

## Read first

- This repository's own `AGENTS.md`, `CLAUDE.md`, `context/ai-workflow-rules.md`, and `context/progress-tracker.md`: the templates are modeled on them
- `lib/project-specs.ts`, `types/build-plan.ts`, `lib/canvas-mermaid.ts`, `lib/canvas-snapshot.ts`

## Install

- `fflate` (small; zips in memory on the server)

## Implementation

1. **Static templates: `lib/agent-pack/templates.ts`.** Plain template functions, with no LLM involved:
   - `agentsMd({ projectName })`: read order, dependency-aware unit workflow, definition of done, tracker updates and explicit authority policy. Default to a sequential workflow; distinguish local commits, external publication and deployment. Do not force repeated approvals for actions the owner already authorized.
   - `claudeMd()`: `@AGENTS.md`.
   - `workflowRules()`: adapted from this repository's `ai-workflow-rules.md`.
   - `progressTracker({ units })`: Current Goal is unit 1, Next Up lists every unit in order, and Open Questions carries the spec's open questions.
   - `packReadme({ projectName, generatedAt })`: how to use the pack with Claude Code, Cursor, and Codex, and what "continue" means.

2. **Assembly: `lib/agent-pack/build-pack.ts`** (pure). `buildAgentPack({ project, plan, spec?, graph, brief })` → `Array<{ path, content }>`:

   ```text
   README.md
   AGENTS.md
   CLAUDE.md
   context/project-overview.md          ← plan.contextDocs.projectOverview
   context/architecture-context.md      ← plan.contextDocs.architectureContext
   context/code-standards.md            ← plan.contextDocs.codeStandards
   context/ui-context.md                ← only if present
   context/ai-workflow-rules.md         ← template
   context/progress-tracker.md          ← template
   context/technical-spec.md            ← exact spec linked to this plan, if any
   context/brief.md                     ← briefToMarkdown
   context/architecture.mmd             ← graphToMermaid
   context/canvas.json                  ← snapshot from the plan's pinned generation input
   context/feature-specs/README.md      ← phases + unit index table
   context/feature-specs/01-{slug}.md … ← plan units, zero-padded to 2 digits
   ```

   Paths are validated: relative, no `..`, and slugs re-sanitized.

3. **Route: `GET /api/projects/[projectId]/plans/[planId]/export`** (member).
   - Reads the plan and only its pinned generation input, linked spec and recorded project metadata. Never read a current graph/brief or fall back to a latest spec. Record schema version, source IDs/hashes, file manifest and readiness in the pack; v2 in spec 54 expands this.
   - Responds with `Content-Type: application/zip`, `Content-Disposition: attachment; filename="{slug}-agent-pack.zip"`, and `Cache-Control: private, no-store`.
   - No LLM call, so this is allowed in a request handler. The route must finish in under 10 s for the largest plan; measure it.

4. **UI.** An "Export for coding agents" button in the plan preview dialog and on each plan row, with a short explainer the first time ("Unzip into an empty folder and open it with your coding agent"). The explainer is dismissible and remembered in `localStorage` with try/catch.

## Scope limits

- No GitHub push (backlog), no LLM calls, no per-file selection.

## Edge cases

- A mandatory pinned artifact is missing: fail ready export with 422 and actionable details. Draft export may omit it only with a blocker manifest and prominent draft label. Individual deletion of referenced sources is prohibited by spec 36.
- Live changes do not alter a pinned pack. Show staleness in the export UI; use a new plan/input revision to include the changes. Include the same manifest through MCP so file reads cannot drift between versions.

## Tests

- `buildAgentPack`: the complete file list; zero-padded names; no path traversal; `progress-tracker.md` points at unit 1; the optional files appear only when present.
- Route: headers, the access matrix, and that the zip opens with the expected entries (unzip in the test with `fflate`).

## Check when done

- [ ] The downloaded zip unzips into the structure above.
- [ ] Opening it in Claude Code and saying "continue" starts unit 1. Verify this once by hand and record it in the tracker.
- [ ] Definition of done in `context/feature-specs/README.md`.

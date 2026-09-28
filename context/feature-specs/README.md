# Feature Specs — Roadmap and Conventions

Omega AI turns a plain-English idea into a reviewed system architecture, a technical specification, and a build plan that a coding agent can execute unit by unit. It covers planning (the project brief), designing (the collaborative canvas), architecture (the AI design agent and architecture review), and handoff (the spec, the build plan, the agent pack, and the MCP server).

Every file in this folder is one **unit of work**: small enough to review as one commit, and verifiable on its own. Build them **strictly in numeric order**. Each spec names what it depends on, and the order below already satisfies every dependency.

## How an agent works through a spec

1. Read the context files in the order `context/AGENTS.md` lists, then this README, then the spec.
2. Read every file the spec's **Read first** section names. Check real APIs in `node_modules` before using them (the Next.js warning in `AGENTS.md` applies to every library here, not only Next.js).
3. Implement only what the spec asks for. Anything the spec leaves undefined goes into **Open Questions** in `progress-tracker.md`, not into code.
4. Run the definition of done (below), then update `progress-tracker.md`: add a Completed entry, set the Current Goal to the next spec, and record any decision that departs from the spec's wording under **Architecture Decisions**.

## Definition of done (applies to every spec from 21 onward)

- `npm run lint`, `npm run typecheck`, `npm test`, and `npm run build` all pass.
- New pure logic in `lib/` has unit tests. New route handlers have tests for their auth, validation, and access branches.
- No new raw colors in components. Use the tokens in `app/globals.css` (see `ui-context.md`).
- New environment variables are added to `lib/env.ts` and `.env.example`, and listed under the spec's **Environment** heading.
- `progress-tracker.md` reflects what was actually built and what was actually verified. Anything not observed in a browser is recorded as not observed.

## Shared conventions the specs rely on

Specs refer to these by name instead of repeating them.

- **Route shape:** authenticate → parse the body with zod → resolve access → act → respond. Errors always go through `lib/api-response.ts` codes, never ad-hoc JSON.
- **Access levels:** a *member* is the owner or a collaborator (`getProjectAccess` in `lib/project-access.ts`). An *owner* check uses `findOwnedProject` in `lib/projects.ts`. Workspace-facing reads answer `404` for both "missing" and "not invited".
- **Room ID = project ID** (the cuid). A route that receives a `roomId` resolves the project through a member check. A client-supplied `projectId` is never trusted.
- **Server reads the canvas.** AI tasks, specs, reviews, exports, and snapshots read nodes, edges, and the brief from the Liveblocks room on the server (`lib/canvas-room.ts`, created in spec 25). They never accept a graph from the client.
- **Canvas schema:** `lib/canvas-schema.ts` (spec 23) is the single validator for every graph that crosses a boundary: templates, snapshots, checkpoints, imports, and AI output.
- **Realtime channels:** Liveblocks Storage holds the flow (the default key used by `useLiveblocksFlow`) and `brief` (spec 28). Feeds `ai-chat` and `ai-status-feed` (specs 29–30) carry chat and AI status. Presence carries `cursor` and `thinking`. The AI agent appears as the Liveblocks user `omega-ai`.
- **Background work:** anything that calls an LLM runs in a Trigger.dev task under `trigger/`, tracked by a `TaskRun` row (spec 31). Request handlers only enqueue.
- **Artifacts:** large content lives in Vercel Blob; Prisma stores the reference plus metadata. Blob URLs are never sent to the browser; downloads go through access-checked routes.
- **One AI run per project at a time**, whatever its kind (spec 31). Every AI run that changes the canvas creates a checkpoint first (specs 26 and 33).

## Spec template

New specs use this shape:

```md
# NN — Title

**Phase:** … · **Depends on:** NN, NN · **Unlocks:** NN

## Goal
One paragraph: the user-visible outcome and why it matters.

## Read first
Files and docs to read before writing code.

## Install
Packages, with a note to verify the current API in node_modules.

## Environment
New variables (also added to lib/env.ts and .env.example).

## Implementation
Numbered steps naming exact files, functions, and components.

## Contracts
Types, schemas, routes (request / response / error codes), storage keys.

## Scope limits
What this unit must not do.

## Edge cases
The failure modes the implementation has to handle.

## Tests
What must be covered.

## Check when done
A checklist a reviewer can verify.
```

## Roadmap

Specs 01–20 are complete (see `progress-tracker.md`).

### Phase 4 — Foundations and canvas durability

| # | Spec | Outcome |
| --- | --- | --- |
| 21 | `21-quality-foundation.md` | Vitest, zod, validated env, CI, test scripts |
| 22 | `22-project-navigation-errors.md` | Projects open from the sidebar; failures are visible |
| 23 | `23-canvas-schema-metadata.md` | Semantic node kinds, tech, and descriptions; one shared canvas validator |
| 24 | `24-node-inspector.md` | Inspector panel for the selected node or edge |
| 25 | `25-canvas-autosave.md` | Server-side snapshots to Blob, restore on empty room, save status |
| 26 | `26-canvas-checkpoints.md` | Named checkpoints and one-click restore |
| 27 | `27-canvas-auto-layout.md` | Deterministic layout engine and a "Tidy up" action |
| 28 | `28-project-brief.md` | Collaborative requirements brief that every AI task reads |

### Phase 5 — The AI design agent

| # | Spec | Outcome |
| --- | --- | --- |
| 29 | `29-ai-presence-status.md` | Shared AI status feed, room-wide busy state, AI presence |
| 30 | `30-ai-chat-feed.md` | Server-authored, shared room chat |
| 31 | `31-design-agent-api.md` | Trigger.dev, `TaskRun`, run tokens, a stub design task |
| 32 | `32-ai-chat-functional.md` | Prompt → run → reply, working end to end with the stub |
| 33 | `33-design-agent-logic.md` | Gemini design agent writing validated changes to the canvas |
| 34 | `34-ai-guardrails-usage.md` | Rate limits, cancellation, stale-run reaper, usage accounting |

### Phase 6 — Specification and handoff

| # | Spec | Outcome |
| --- | --- | --- |
| 35 | `35-spec-generation-flow.md` | Spec task with a deterministic Mermaid diagram and component inventory |
| 36 | `36-spec-persistence-download.md` | `ProjectSpec`, Blob storage, list / content / download / delete routes |
| 37 | `37-spec-ui-integration.md` | Specs tab: generate, list, preview, download |
| 38 | `38-architecture-review.md` | Deterministic lint plus an AI review, with findings linked to nodes |
| 39 | `39-build-plan-generation.md` | Ordered, agent-ready implementation units generated from the design |
| 40 | `40-agent-handoff-export.md` | A downloadable `AGENTS.md` + `context/` pack for coding agents |
| 41 | `41-canvas-export-import.md` | PNG, SVG, Mermaid, and JSON export; JSON import |

### Phase 7 — Collaboration depth and platform

| # | Spec | Outcome |
| --- | --- | --- |
| 42 | `42-node-comments.md` | Comment threads pinned to nodes |
| 43 | `43-command-palette.md` | ⌘K palette for every workspace action and node search |
| 44 | `44-platform-hardening.md` | Security headers, error pages, logging, health, auth migration |
| 45 | `45-personal-access-tokens.md` | Hashed, revocable API tokens for programmatic access |
| 46 | `46-mcp-server.md` | MCP server so coding agents read projects, specs, and plans directly |

## Backlog (not yet specified)

Candidates for specs after 46, in rough priority order. Each one needs a spec written in the template above before anyone builds it.

- Multiple diagram views per project (system context, containers, deployment).
- Data-model entities with typed fields and relationships, and an ERD view.
- API contract design on service nodes, with OpenAPI export.
- A clarifying-questions mode, where the design agent asks before it designs.
- Push the agent pack to a GitHub repository as a pull request.
- Viewer role and read-only share links (this needs the project overview's scope to change first).
- Spec diffing between generations.
- Cloud cost estimation from node kinds and technologies.
- Mermaid and draw.io import.

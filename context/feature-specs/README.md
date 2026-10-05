# Feature Specs — Roadmap and Conventions

Omega AI turns an idea or an existing repository into traceable requirements, reviewed system contracts, a versioned architecture, a dependency-aware implementation plan and a complete agent build package. Humans can plan together with agents or authorize bounded autonomous planning. Later capabilities connect coding agents, verify delivered work and optionally execute builds in isolated environments.

Specs 01–46 are the original incremental foundation; specs 47–65 are capability milestones, implemented as smaller reviewable sub-units recorded in the tracker. Numeric order is the default and dependencies are mandatory. Pull forward only the release-specific validation slices from 63–65 described below; do not mark their parent milestones complete early. Completed specs are historical; recorded implementation decisions explain their deviations.

Read [the roadmap assessment](../roadmap-assessment.md) for findings and release boundaries, and [the shared agentic contracts](../agentic-platform-contracts.md) for state, identity, authority and verification rules. New specs are planned, not implemented. Current implementation is complete through 22, with 23 next.

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
- Artifact-producing features prove revision consistency, idempotent retry, requirement coverage and failure recovery. Relevant concurrent/revocation paths have integration tests against isolated infrastructure; mocked unit tests alone do not establish transaction safety.
- Ready, verified, integrated and released are separate states. Drafts may be useful but cannot pass a readiness gate with missing requirements, invalid references or unresolved blocking choices.
- Documentation-only roadmap changes validate links, numbering, dependencies and consistency; they do not require rerunning application builds when no runtime files changed.

## Shared conventions the specs rely on

Specs refer to these by name instead of repeating them.

- **Route shape:** authenticate → parse the body with zod → resolve access → act → respond. Errors always go through `lib/api-response.ts` codes, never ad-hoc JSON.
- **Access levels:** a *member* is the owner or a collaborator (`getProjectAccess` in `lib/project-access.ts`). An *owner* check uses `findOwnedProject` in `lib/projects.ts`. Workspace-facing reads answer `404` for both "missing" and "not invited".
- **Room ID = project ID** (the cuid). A route that receives a `roomId` resolves the project through a member check. A client-supplied `projectId` is never trusted.
- **Server reads the canvas.** AI tasks, specs, reviews, exports, and snapshots read nodes, edges, and the brief from the Liveblocks room on the server (`lib/canvas-room.ts`, created in spec 25). They never accept a graph from the client.
- **Canvas schema:** `lib/canvas-schema.ts` (spec 23) is the single validator for every graph that crosses a boundary: templates, snapshots, checkpoints, imports, and AI output.
- **Realtime channels:** Liveblocks Storage holds flow and brief. Canonical chat and run state live in PostgreSQL; feeds notify clients to refresh those records and are not an author/permission boundary. Presence carries cursor/thinking only.
- **Background work:** anything that calls an LLM runs in a Trigger.dev task under `trigger/`, tracked by a `TaskRun` row (spec 31). Request handlers only enqueue.
- **Artifacts:** large content lives in Vercel Blob; Prisma stores the reference plus metadata. Blob URLs are never sent to the browser; downloads go through access-checked routes.
- **One planning writer per project** by database lease/outbox, independent of realtime notifications (31). Every canvas edit has a checkpoint, conditional atomic mutation and persisted effect identity. Parallel coding workers in 62 have separate isolated workspaces and serialized integration; they do not bypass the planning writer lease.
- **Consistent artifacts:** specs 35–40 pin immutable generation inputs. Spec 50 extends these into baselines for requirements, decisions, contracts and repository commits. Export and MCP use the same exact-revision resolver.

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

Specs 01–22 are complete (see `progress-tracker.md`).

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

### Phase 8 — Requirements and system definition

| # | Spec | Outcome |
| --- | --- | --- |
| 47 | [47-requirements-discovery-decisions.md](47-requirements-discovery-decisions.md) | Requirements, Discovery and Decisions |
| 48 | [48-software-profiles.md](48-software-profiles.md) | Software Profiles and Support Levels |
| 49 | [49-product-system-contracts.md](49-product-system-contracts.md) | Product, Interface and System Contracts |
| 50 | [50-baselines-change-control.md](50-baselines-change-control.md) | Baselines, Revisions and Change Impact |

### Phase 9 — Scalable planning and complete handoff

| # | Spec | Outcome |
| --- | --- | --- |
| 51 | [51-hierarchical-build-plans.md](51-hierarchical-build-plans.md) | Hierarchical Plans and Requirement Coverage |
| 52 | [52-milestones-daily-scheduling.md](52-milestones-daily-scheduling.md) | Milestones, Daily Sessions and Capacity |
| 53 | [53-versioned-context-retrieval.md](53-versioned-context-retrieval.md) | Versioned Context and Source Provenance |
| 54 | [54-reproducible-agent-pack.md](54-reproducible-agent-pack.md) | Reproducible Agent Pack and Readiness |

### Phase 10 — Autonomy, verification and agent feedback

| # | Spec | Outcome |
| --- | --- | --- |
| 55 | [55-autonomous-planning-controller.md](55-autonomous-planning-controller.md) | Collaborative and Autonomous Planning |
| 56 | [56-verification-evidence-gates.md](56-verification-evidence-gates.md) | Verification Plans and Evidence Gates |
| 57 | [57-execution-ledger-resume.md](57-execution-ledger-resume.md) | Execution Ledger, Leases and Resumption |
| 58 | [58-scoped-agent-bridge.md](58-scoped-agent-bridge.md) | Scoped Agent Reporting and MCP Bridge |

### Phase 11 — Existing repositories and managed delivery

| # | Spec | Outcome |
| --- | --- | --- |
| 59 | [59-existing-repository-intake.md](59-existing-repository-intake.md) | Existing Repository Intake and Drift |
| 60 | [60-repository-delivery-integration.md](60-repository-delivery-integration.md) | Pull Request Delivery and Integration |
| 61 | [61-isolated-execution-runtime.md](61-isolated-execution-runtime.md) | Isolated Execution Runtime |
| 62 | [62-bounded-build-orchestration.md](62-bounded-build-orchestration.md) | Bounded Autonomous Build Orchestration |

### Phase 12 — Operations, evaluations and launch

| # | Spec | Outcome |
| --- | --- | --- |
| 63 | [63-operations-data-lifecycle.md](63-operations-data-lifecycle.md) | Operations, Data Lifecycle and Release Readiness |
| 64 | [64-agent-quality-evaluations.md](64-agent-quality-evaluations.md) | Agent Quality Evaluations and Dogfooding |
| 65 | [65-workspace-accessibility-launch.md](65-workspace-accessibility-launch.md) | Workspace Usability, Accessibility and Launch Gates |

## Release gates

| Release | Required capabilities | Evidence required |
| --- | --- | --- |
| Architecture/handoff preview | 22–46 and their amended reliability contracts | Spec 44 browser/access/recovery suite; immutable export; no skipped release build |
| Planning platform | 47–56 plus applicable validation slices from 63–65 | Complete ready package; fresh-agent implementation and resume; evaluated supported profiles |
| Connected delivery | 57–60 plus applicable 63–65 slices | Scoped claims/reporting, verified commit-bound CI and reviewable PR delivery |
| Managed execution | 61–65 | Sandbox isolation, bounded cost/authority, cancellation, crash recovery and verified integration |

Build release validation alongside the capability it protects. Numbering is not a reason to postpone security, browser tests or evaluations until the end. Use the detailed gate definitions in `context/roadmap-assessment.md`.

## Deferred product extensions

- Viewer roles, public share links and enterprise organizations need a separate access model and spec.
- Billing, organization quotas and commercial packaging remain outside this engineering roadmap.
- Cloud cost prediction, Mermaid/draw.io import, marketplace extensions and richer visual design tooling remain optional follow-ups.
- No claim of universal or safety-critical software support; expand profile support only with corresponding toolchains and evaluation evidence.

# Omega AI

## Overview

Omega AI is a collaborative and agentic software-planning and delivery platform. A person or team supplies an idea, requirements or an existing repository. Humans and agents refine requirements, decisions, architecture and contracts together, or the owner authorizes bounded autonomous planning. Omega produces a complete, versioned folder that coding agents can build from across sessions and days, with measurable acceptance criteria and resumable progress.

The foundation covers **discover → design → review → specify → plan → hand off**. Later releases add **implement → verify → integrate → operate** through scoped external agents and optional isolated execution. The roadmap describes the destination; the implemented app currently ends at the spec 21 foundation.

## Goals

1. Let authenticated users create, open, and manage architecture projects.
2. Capture requirements in a shared project brief before and during design.
3. Provide a collaborative real-time canvas for system design, where every node carries meaning (kind, technology, description), not only a shape.
4. Let users import prebuilt starter designs and export designs in standard formats.
5. Let AI generate and extend an architecture from a prompt, safely and reversibly.
6. Review architectures with deterministic checks plus an AI reviewer, with findings linked to the canvas.
7. Convert the design into a persistent Markdown technical spec.
8. Generate an agent-ready build plan and a downloadable context pack, and serve them to coding agents over MCP.
9. Trace every in-scope requirement to contracts, implementation units and observable verification criteria.
10. Support profile-specific planning for web, services, CLI/libraries and progressively evaluated native, data/ML, infrastructure, game and embedded targets.
11. Decompose large projects into milestones, dependency-aware units and capacity-based daily sessions, with honest estimate ranges.
12. Preserve exact inputs, decisions and handovers so a fresh agent can resume work without the original chat.
13. Offer bounded autonomous planning and, separately, authorized execution with verifiable evidence, spending limits and recovery.

## Core User Flow

1. User signs in.
2. User creates or opens a project.
3. User fills in the project brief (problem, users, goals, requirements, constraints).
4. User optionally imports a starter design.
5. User prompts the AI to generate or extend the design; everyone in the room watches it happen.
6. Collaborators edit, comment on, and refine the design; checkpoints make any change reversible.
7. User runs an architecture review and fixes findings, by hand or with the AI.
8. User generates the technical spec.
9. User generates a build plan and exports the agent pack, or connects a coding agent over MCP.
10. A coding agent builds the system one unit at a time.
11. For connected delivery, the agent claims dependency-ready units, submits commit-bound evidence and records blockers/handover state.
12. Humans or authorized policies review changes and integration. Source changes create new plan revisions and revalidate affected work. Deployment is a separate authorized release action.

## Features

### Authentication and Projects

- User sign-in and route protection.
- Project creation, ownership, and collaborator access by email.
- Project list, recent projects, and workspace navigation.

### Planning

- A collaborative project brief with fixed sections, stored in the room and read by every AI task.
- Planned in 47–55: structured requirements, clarification, durable decisions, profile-specific contracts, versioned baselines, hierarchical plans, daily sessions and manual/collaborative/autonomous planning modes.

### Collaborative Canvas

- Shared real-time canvas using Liveblocks and React Flow.
- Live cursors, presence indicators, and node and edge editing.
- Semantic node kinds, technologies, and descriptions; edge protocols and sync/async mode; an inspector panel.
- Deterministic auto-layout.
- Autosave to Vercel Blob, named checkpoints, and one-click restore.
- Comment threads pinned to nodes.
- A command palette and keyboard shortcuts.

### Starter System Designs

- A curated library of prebuilt system design templates.
- Users can import a starter template into the canvas at any point during editing.
- Templates are static canvas snapshots loaded directly into the active room.
- Covers common patterns: monolith, microservices, event-driven, serverless, and more.

### AI Architecture Generation

- AI generates or extends a system design from a user prompt, using the brief, the current canvas, and the room's chat as context.
- Output is a validated plan of canvas operations, applied into the shared room; placement comes from the layout engine.
- Generation runs as a durable background task, with shared status, AI presence, cancellation, and rate limits.
- Every AI edit is preceded by a checkpoint and can be undone in one click.

### Architecture Review

- Deterministic lint rules plus an AI review, producing severity-ranked findings linked to nodes and edges.
- Findings can be sent to the design agent as a fix request.

### Spec Generation

- The current design is converted into a Markdown technical specification, with a deterministic Mermaid diagram and component inventory.
- Specs are persisted in Vercel Blob and linked to the project in the database.
- Users can preview, copy, and download specs.

### Build Plan and Agent Handoff

- An ordered build plan of self-contained implementation units, in the same spec format this repository uses.
- A downloadable agent pack: `AGENTS.md`, `CLAUDE.md`, context documents, and numbered feature specs.
- Canvas export as PNG, SVG, Mermaid, and JSON; JSON import.
- Personal access tokens and a read-only MCP server for coding agents.
- Planned in 54: an offline-verifiable pack containing exact source revisions, manifest/hashes, requirements, contracts, decisions, setup/environment instructions, verification definitions, operations guidance and session handovers.
- Planned in 56–62: evidence-based completion, durable execution state, separate scoped reporting credentials, existing-repository intake, pull requests and an optional isolated build runtime.
- Planned in 63–65: retention/erasure, recovery, cross-profile evaluations, accessible workflows and release evidence. See `roadmap-assessment.md` for release gates.

## Scope

### In Scope

- Authentication and route protection
- Project creation and ownership
- Collaborator access by project
- Project brief
- Starter system design template library and import
- Real-time shared canvas with semantic nodes, edges, presence, comments, and checkpoints
- AI-powered architecture generation from prompts
- Architecture review
- AI-powered Markdown spec generation from the canvas graph
- Build plan generation and the agent pack export
- Canvas export and JSON import
- Persistent storage for project metadata and generated artifacts
- Personal access tokens and a read-only MCP server
- Versioned requirements/decisions/contracts and change impact
- Autonomous planning within owner-defined policy, without mandatory repeated approval of routine authorized choices
- Milestones, dependency-aware daily sessions and fresh-agent resumption
- Existing-repository planning and scoped agent progress/evidence reporting
- Reviewable repository delivery and optional managed execution, gated separately
- Quality evaluations, accessibility, security, operational readiness and data lifecycle

### Out Of Scope

- Billing and subscription systems
- Enterprise permission tiers beyond owner and collaborator (no viewer role or share links yet)
- Unrestricted external-tool access, autonomous changes to permission policy or automatic production deployment without a release grant
- A native mobile Omega client (planning software that targets mobile is in scope)
- Guaranteed success for every language/domain, or safety-critical/regulatory certification from generic AI reviews

## Success Criteria

1. A signed-in user can create and open a project.
2. Multiple users can collaborate in the same canvas simultaneously.
3. A user can import a prebuilt starter design into the canvas.
4. AI can generate an architecture into the shared room from a prompt, and the change can be undone.
5. The design can be reviewed, and findings point at the affected components.
6. The design can be converted into a persisted Markdown spec.
7. A build plan and agent pack can be generated, and a coding agent can start building from the pack.
8. Project metadata and generated artifacts are stored in the correct layers.
9. A ready package has complete requirement coverage, internally consistent pinned revisions and no unresolved blocking decisions; drafts remain clearly labelled.
10. A fresh coding agent can start and resume a representative project from its package without reconstructing missing context.
11. Large plans can span sessions/days without skipping prerequisites, hiding uncertainty or exceeding the authorized budget.
12. Reported success is distinguished from verified, integrated and released work, with evidence at the correct revision/commit.
13. Each advertised software profile and autonomy tier passes the measured release gates in specs 63–65; unsupported targets are explicit.

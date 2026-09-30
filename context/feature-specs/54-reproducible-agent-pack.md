# 54 — Reproducible Agent Pack and Readiness

**Phase:** 9 · **Depends on:** 40, 48, 49, 50, 51, 52, 53 · **Unlocks:** 55, 56, 58

## Goal

Deliver a complete folder that an independent coding agent can validate, understand and resume, with a clear distinction between a draft plan and a build-ready package.

## Read first

- `context/agentic-platform-contracts.md` and roadmap release gates.
- `lib/agent-pack/build-pack.ts`, templates and export route; all plan v2 and baseline contracts.

## Install

Use existing packages; select maintained validators/archive tooling only where required and verify their installed APIs.

## Environment

No new required variables. Optional integrations must validate configuration at their boundary.

## Implementation

1. Add `types/agent-pack.ts` and `lib/agent-pack/manifest.ts`, `validate.ts`, `readiness.ts`. Manifest includes schema/pack versions, baseline/plan/profile revisions, file hashes, stable unit index, prerequisites, tooling assumptions, provenance, unresolved blockers and readiness.

2. Expand the deterministic package: root README/AGENTS/CLAUDE, machine-readable manifest/plan/requirements/schedule, context documents, decisions, contracts, architecture views, threat model, verification definitions, environment examples without values, dependency/toolchain instructions, operations and rollback runbooks, numbered unit specs and daily handovers. Omit inapplicable artifacts only with explicit rationale.

3. Generate `START-HERE.md` with read order, prerequisite checks, verified versus assumed commands, first ready unit and resume procedure. Use profile-specific commands; do not copy Omega's stack or unconditional ask-before-every-commit rule into all targets. Root instructions encode the owner's actual authority policy.

4. Create an offline package validator using the same schemas and hashing rules. It checks safe/unique paths, required files, hashes, links, DAG, requirement coverage, unresolved blockers and readiness. It never executes included scripts. JSON is authoritative for IDs/status; generated Markdown is a readable view.

5. Expose draft export and ready export separately; ready export fails with 422 and actionable issues. Normalize archive metadata/order for reproducible bytes from the same pack revision. A checksum detects corruption but does not prove a trusted publisher; trusted imports require authenticated provenance.

## Contracts

`AgentPackManifest { schemaVersion, packId, baselineId, planRevisionId, profileRefs, files[{path,sha256,size}], readiness, blockers, authorityPolicyRef }`. Export uses only pinned artifacts. Missing mandatory sources block ready export; no live/latest fallback. Shared API/storage/access rules apply.

## Required package layout

```text
README.md
START-HERE.md
AGENTS.md
CLAUDE.md
.omega/manifest.json
.omega/plan.json
.omega/requirements.json
.omega/contracts-index.json
.omega/verification.json
.omega/schedule.json
context/project-overview.md
context/architecture-context.md
context/code-standards.md
context/ai-workflow-rules.md
context/progress-tracker.md
context/technical-spec.md
context/decisions/ADR-*.md
context/contracts/*
context/architecture/*
context/security/threat-model.md
context/testing/verification-plan.md
context/operations/deployment.md
context/operations/rollback.md
context/feature-specs/README.md
context/feature-specs/{number}-{slug}.md
context/sessions/day-{ordinal}.md
environment/README.md
environment/.env.example
```

Profile-required artifacts extend this layout; optional sections require recorded not-applicable reasons. Add `context/ui-context.md` for UI targets. Filename number padding derives from the plan size; stable unit IDs live in frontmatter/manifest and survive reorder. Every read-first reference must resolve inside the package or identify an explicit external prerequisite. The manifest hashes the immutable exported starting state; subsequent execution events live under a separate mutable `.omega-runtime/` directory and do not rewrite the original plan/acceptance criteria. Re-exporting accepted changes creates a new pack revision.

## Scope limits

No application code execution, secret embedding, guarantee that an agent follows prose, or overwriting existing repository files without a diff.

## Edge cases

Case-insensitive path collisions, drive paths, zip bombs, changed live canvas, missing pinned spec, profile without browser UI and an imported pack with forged ready metadata.

## Tests

Byte-reproducible exports; unpack/validate fixtures on Windows and Linux path semantics; bad hashes and broken links; validator recomputes readiness instead of trusting metadata. Include shared authorization/revision tests.

## Check when done

- [ ] A new agent can identify setup, first executable unit and verification without prior chat.
- [ ] A ready package is consistent, complete and validates offline.
- [ ] Definition of done and relevant release gate; record slices and verification in the tracker.

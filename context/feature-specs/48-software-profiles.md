# 48 — Software Profiles and Support Levels

**Phase:** 8 · **Depends on:** 23, 47 · **Unlocks:** 49, 51, 54, 64

## Goal

Plan for different types of software without imposing Omega's own Next.js/PostgreSQL stack on every generated project. Make supported, experimental and unsupported capabilities explicit.

## Read first

- `context/agentic-platform-contracts.md` and the roadmap release gates.
- `types/canvas.ts`, `lib/canvas-schema.ts`, `lib/build-plan/validate-plan.ts`, `lib/agent-pack/templates.ts`.

## Install

Use existing dependencies unless this spec names a capability needing a maintained package. Verify installed APIs before selection; record new packages and reasons.

## Environment

None beyond the dependencies' existing configuration. Any optional integration must remain disabled until its configuration is validated.

## Implementation

1. Create `types/software-profile.ts` and a versioned, data-only registry in `lib/profiles/`. A profile declares project types, required artifacts, toolchain/platform constraints, verification kinds, node kinds and deployment/release needs. Profile extensions cannot contain executable code.

2. Provide initial profile fixtures for web/full-stack, API/service, CLI/library, mobile/desktop, data/ML, infrastructure, game and embedded. Mark only evaluated toolchain combinations supported; the remainder experimental. Multi-profile projects compose requirements and report incompatible choices.

3. Add a project profile picker and stack decision panel in `components/editor/project-profile-panel.tsx`. Capture greenfield/brownfield, target OS/architecture, language/runtime, package manager, distribution target, accessibility, data sensitivity and licensing constraints. Selecting a profile proposes defaults; existing accepted decisions require an explicit change.

4. Update planner prompts, schema normalization and package templates to use the selected profile version. Permit library modules, local processes, datasets and device boundaries without requiring a service diagram. The planning graph is independent of visual styling; preserve existing canvas kinds.

5. Add `lib/profiles/readiness.ts` to identify missing applicable artifacts and justified not-applicable sections. Platform constraints are validated at planning time and again against the execution environment.

## Contracts

`SoftwareProfile { id, version, supportLevel, projectTypes[], capabilities[], requiredArtifactKinds[], toolchainConstraints, verificationKinds[] }`; `ProjectProfileSelection { profileRefs[], overrides, revision }`. `/profiles` GET lists catalog; `/profile` GET/PATCH controls project selection. Shared access, pagination, revision, storage and error rules apply.

## Scope limits

No promise of certified support for regulated, medical, avionics or safety-critical software. Omega's UI remains a web app; generated target software can be native.

## Edge cases

A Windows desktop project cannot silently get a Linux-only build recipe; offline embedded targets do not inherit browser or cloud assumptions.

## Tests

Validate web, Python CLI, native mobile, data pipeline and firmware fixtures; profile composition conflicts; legacy projects without a selection. Include the shared authorization and concurrency checks.

## Check when done

- [ ] A non-web fixture generates appropriate requirements and verification needs.
- [ ] Profile/version/support level is visible and preserved in exports.
- [ ] Definition of done and relevant release gate; record implementation slices and observed evidence in the tracker.


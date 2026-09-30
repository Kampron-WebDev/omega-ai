# 65 — Workspace Usability, Accessibility and Launch Gates

**Phase:** 12 · **Depends on:** 44, 54, 55, 56, 57, 60, 62, 63, 64 · **Unlocks:** evidence-backed release

## Goal

Make a complex platform understandable and usable, and release only capabilities demonstrated to work for real users.

## Read first

- `context/agentic-platform-contracts.md` and roadmap release gates.
- `context/ui-context.md`, workspace/sidebar/dialog components, requirements/planning/execution panels, release gates and evaluation results.

## Install

Choose maintained tooling for the named validation capabilities at implementation time; keep live integration and evaluation tooling separate from ordinary unit tests.

## Environment

Dedicated non-production test/provider credentials where needed, optional until the capability is enabled. Document every new variable in the validated environment and example file; do not put secrets in fixtures.

## Implementation

1. Create a workspace information architecture with Overview, Requirements, Design, Plan and Delivery surfaces. Keep chat as an assistant to these records. Avoid adding every capability as another narrow sidebar tab. Provide a guided path from idea/import to ready package with a clear next action and blockers.

2. Implement keyboard navigation, semantic forms/tables, focus restoration, reduced motion, responsive layouts, readable contrast and screen-reader status updates. Provide list/text alternatives for essential canvas actions and explicit save/offline/reconnecting states.

3. Add Playwright and accessibility checks in a dedicated test suite. Use isolated test infrastructure and authorized synthetic identities; reuse existing test sessions where available. Never create production identities implicitly. Multi-user tests cover collaboration, revocation and stale edits; retain failure traces without secrets.

4. Implement release-specific journeys: preview create/share/edit/save/restore/generate/export; planning discovery/decision/day-plan/ready-package; connected resume/report/PR/CI; managed pause/cancel/recovery/integrate. Test empty/error/loading/permission/limit states, not only success.

5. Define measured budgets before release: initial targets are p95 local interaction under 200 ms on a documented reference device, 300-node canvas usable at 30 fps, and paginated 1,000-unit plans without rendering every body. Record fixtures/hardware and adjust only with an explicit tradeoff. Publish support levels, known limitations and release evidence; skipped mandatory tests block that capability's launch.

## Contracts

`docs/release-checklist.md` maps each capability to spec, test/eval evidence, supported profiles and owner. New navigation uses stable project URLs and preserves auth/revision scope. Existing dark tokens and component conventions apply. Shared access, storage and API conventions apply.

## Scope limits

No new billing or enterprise organization system. No claim of universal accessibility conformance based only on automated scanning.

## Edge cases

Small viewport with multiple panels, expired session during a draft, keyboard-only canvas user, offline edits, long names and large plans.

## Tests

Real browser journeys on desktop/mobile sizes, keyboard/screen-reader manual checks, accessibility automation, two-user races and performance fixtures. Tests can run against isolated local emulators where faithful; real vendor gaps must remain documented.

## Check when done

- [ ] A new user can reach a ready package and understand blockers without reading technical implementation details.
- [ ] Each shipped release tier has its own passing evidence; unverified capabilities remain disabled or clearly preview-only.
- [ ] Definition of done and release-gate evidence recorded. Pull forward applicable validation slices before earlier releases; this parent milestone stays incomplete until all slices are done.


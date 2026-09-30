# 56 — Verification Plans and Evidence Gates

**Phase:** 10 · **Depends on:** 49, 51, 54, 55 · **Unlocks:** 57, 60, 62, 64

## Goal

Define how every acceptance criterion will be proven, and prevent convincing generated prose or agent self-report from being mistaken for working software.

## Read first

- `context/agentic-platform-contracts.md` and roadmap release gates.
- Plan/requirements contracts, profile verification rules, pack validator and architecture-review models.

## Install

Use existing dependencies; verify provider and protocol APIs before implementation.

## Environment

No new mandatory vendor configuration. Use shared validated environment and project policy; secrets never enter artifacts or logs.

## Implementation

1. Create `types/verification.ts`, `lib/verification/definitions.ts`, `evaluate.ts` and `prisma/models/verification.prisma`. Definitions bind criterion IDs to unit/integration/contract/browser/security/performance/manual checks, required environment and expected observable outcomes.

2. Represent commands as executable plus argument array, working directory and environment-variable names; do not concatenate model text into shell commands. Commands are untrusted proposals until authorized for a particular execution environment. A verification definition has a hash that evidence must reference.

3. Store immutable evidence metadata using the shared Evidence contract, private payloads, redacted logs and authenticated provenance. Agent reports remain unverified; trusted runner or verified CI reports bind to exact commit, environment and definition. Manual criteria require authorized reviewer identity.

4. Implement readiness-to-implement and verification-to-complete as separate gates. Missing required tests, failing checks, stale commits or unverified evidence block completion. A waiver records reviewer, rationale and expiry and remains visible as a risk; it cannot silently turn into a pass.

5. Add `components/editor/verification-panel.tsx`: criterion coverage, failures, not-run/manual checks, evidence details and stale status. Add test instructions and verification schemas to the exported pack. External reports can be imported as agent_report until spec 58 authenticates execution reporting.

## Contracts

`VerificationDefinition { id, revision, criterionIds[], kind, argv?, cwd?, environment, expectedOutcome, requiredProvenance }`; `/verification-definitions`, `/evidence` and `/plans/[id]/verification`. Evidence is append-only; invalidation is a new event. Shared API, storage and access rules apply.

## Scope limits

No execution sandbox yet. Test coverage percentages and AI reviewer approval are not substitutes for acceptance evidence.

## Edge cases

Agent edits tests to make them pass; a green check belongs to an old commit; flaky checks need bounded reruns with all attempts retained; screenshots alone do not prove server authorization.

## Tests

Stale and spoofed evidence, verifier authorization, duplicate uploads, all-required-criteria evaluation, malicious command strings and waiver expiry. Include shared authorization and revision checks.

## Check when done

- [ ] The UI distinguishes not run, failed, reported, verified and waived.
- [ ] A feature cannot be marked verified by a text-only success claim.
- [ ] Definition of done and release gate; persist verification evidence and incomplete observations in the tracker.


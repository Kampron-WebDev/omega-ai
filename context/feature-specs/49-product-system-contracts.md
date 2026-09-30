# 49 — Product, Interface and System Contracts

**Phase:** 8 · **Depends on:** 38, 47, 48 · **Unlocks:** 50, 51, 54

## Goal

Give coding agents precise interfaces, data semantics and user behavior, rather than asking them to invent these from diagram labels. Represent multiple architecture views over shared component identities.

## Read first

- `context/agentic-platform-contracts.md` and the roadmap release gates.
- `lib/canvas-schema.ts`, `lib/architecture-lint.ts`, `lib/spec/assemble-spec.ts`, requirements/profile modules.

## Install

Use existing dependencies unless this spec names a capability needing a maintained package. Verify installed APIs before selection; record new packages and reasons.

## Environment

None beyond the dependencies' existing configuration. Any optional integration must remain disabled until its configuration is validated.

## Implementation

1. Create `types/system-contract.ts`, `lib/contracts/validate.ts`, `lib/contracts/traceability.ts` and `prisma/models/system-contract.prisma`. Version artifact metadata in Prisma and content in private Blob storage. Contracts reference requirements, criteria, components and producer/consumer IDs.

2. Implement contract kinds: HTTP/API, events, data model, UX journey, deployment and nonfunctional budget. API contracts include schemas, errors, authentication, pagination and idempotency; events include delivery, ordering and compatibility; data contracts include ownership, lifecycle, migrations and retention.

3. UX contracts include screens/states, navigation, validation, empty/loading/error states, accessibility and responsive behavior. Quality contracts include measurable latency/throughput/availability targets, threat boundaries, observability and cost assumptions. Profiles supply applicable native/data/device extensions; unsupported extensions remain explicit drafts.

4. Provide structured editors and proposal previews in `components/editor/contracts/`. AI drafts are reviewed under project policy. Add system/context/deployment/data views referencing shared component IDs, without duplicating the canonical entities. Keep each rendered view within the canvas limit.

5. Export validated OpenAPI for HTTP contracts and JSON Schema for payloads; pin the format versions in the artifact. Use maintained validators selected at implementation time. Detect missing producers, incompatible schema changes, contradictory ownership and unmapped acceptance criteria before marking contracts ready.

## Contracts

`SystemContract { id, revision, kind, schemaVersion, requirementIds[], componentIds[], contentHash, status }`; `/contracts` and `/contracts/[id]/revisions`; `/architecture/views`. Views contain component references and layout, never a second copy of component semantics. Shared access, pagination, revision, storage and error rules apply.

## Scope limits

No automatic database migration execution, no generated wireframe required for headless software, and no claim that structural lint proves architecture quality.

## Edge cases

Removed components leave explicit stale references; a queue permits retries and duplicates; a local database in a desktop profile must not trigger an unconditional client-to-database security failure.

## Tests

Producer/consumer compatibility, migration/backfill acceptance, broken references, view identity preservation and profile-dependent lint fixtures. Include the shared authorization and concurrency checks.

## Check when done

- [ ] An agent can implement a producer and consumer independently against the same pinned contract.
- [ ] Required UX, data, security and deployment behavior is explicit or justified as not applicable.
- [ ] Definition of done and relevant release gate; record implementation slices and observed evidence in the tracker.


# Agentic platform contracts

Status: planned. Applied incrementally by specs 47–65; baseline reliability rules also apply to the amended specs 25–46. This document specifies Omega's product contracts, not behavior already present in code.

## Identity, versions and authority

- Stable opaque IDs identify requirements (`REQ-*`), acceptance criteria (`AC-*`), decisions (`ADR-*`), contracts (`CTR-*`), units (`UNIT-*`), milestones and sessions. Display numbers and filenames are not identity. References are always project-scoped.
- Every generated artifact has `schemaVersion`, immutable `revisionId`, `sourceBaselineId`, content hash, producer/prompt version and provenance. Before spec 50, `generationInputId` pins graph/brief/chat IDs and linked spec; spec 50 migrates it into the richer baseline.
- A baseline pins exact requirements, accepted decisions, contract/profile versions, graph/views, brief, source documents and optional repository commit. Edits create a new revision; changing the current pointer never rewrites an old artifact.
- Small indexed records and state transitions belong in PostgreSQL. Large documents, plans and evidence payloads belong in private Blob storage. Authoritative chat records are bounded database rows; realtime feeds are notification projections. Vector indexes, if introduced, are disposable derived data.
- Endpoints authenticate and check project membership before resolving IDs. Session routes follow existing access rules. Personal read tokens remain read-only. Spec 58 introduces a distinct, expiring execution credential bound to project, plan revision, execution and allowed operations. It cannot manage membership, approve policy, or issue credentials.
- Recheck authorization before task side effects and after long waits. Revocation cancels future effects, invalidates leases, and stops managed runners. A prompt, repository file or generated instruction cannot expand authority.

## Mutation and recovery protocol

- Reserve a run and its project lease transactionally before dispatch; persist an outbox entry and a unique `(projectId, actorId, requestKey)` admission key. A repeated key with the same payload returns the same result; a changed payload returns 409. Dispatch uses the internal run ID as its idempotency key. Provider IDs can be attached after dispatch.
- Workers receive an internal run ID and a fencing epoch. Every durable publication verifies the current lease/epoch and non-terminal state. Lease expiry is based on heartbeats; wall-clock age alone is not evidence of a dead long workflow.
- External storage and database changes are not one transaction. Persist effect intents and results, use idempotent remote operations where supported, and reconcile uncertain results before retrying. Never claim exactly-once behavior for an API that cannot provide it.
- Canvas replacement, import and AI edits use one validated mutation per logical change. The implementation must prove conditional update semantics for the installed collaboration API. If it cannot, publish a proposal and defer application to a serialized, conflict-aware path; a fresh read followed by an unconditional replace is insufficient.
- Content hashes exclude timestamps and presence. Save publication cannot replace a newer accepted revision with an older one. Invalid graph data produces a visible validation failure, not `saved`.
- Cancellation invalidates authorization to publish first, then requests provider cancellation and reconciles effects. Recovery does not undo unrelated human work. An uncertain remote operation is shown as reconciling until its outcome is known.
- Short generation runs expose queued/running/cancelling/reconciling and terminal completed/failed/cancelled states. Paused/needs-input belong to longer planning sessions, whose waiting state releases the writer lease and reacquires it with fresh input validation on resume.

## Planning and readiness

`draft → validating → ready | needs_input | failed`; ready is evaluated against one baseline. A later source change marks affected output stale. Approval records bind actor, exact revision/hash, scope and time; they cannot silently transfer to a new revision.

- Each in-scope requirement maps to acceptance criteria, units and verification definitions. Every high-risk decision has an owner, rationale and resolution. Explicitly deferred requirements include a reason and release boundary.
- Each unit states objective, prerequisites, read-first files, allowed areas, contracts consumed/produced, implementation scope, tests, acceptance IDs, risks, recovery and handover. No forward references to missing work. Unresolved dependencies are blockers.
- Definition of ready is profile-specific and deterministic. No missing in-scope requirement coverage, unresolved blocking question, dangling reference, incompatible contract, invalid dependency graph or secret-bearing pack may be called ready. Draft exports remain available and prominently marked.
- Context selection must preserve relevant accepted constraints, trust labels, source IDs and versions. Summaries cannot replace canonical acceptance criteria or permission policies. Critical context that cannot fit results in partitioning or `needs_input`, never silent truncation.
- Autonomous planning uses an owner-authorized policy: allowed decisions/actions, protected choices, maximum spend/duration/model calls/iterations, stop conditions and escalation rules. Manual and collaborative modes remain first-class. A policy may preauthorize routine planning decisions; it is not permission for repository or production writes.

## Execution, evidence and schedules

- Unit states: `pending`, `ready`, `leased`, `running`, `blocked`, `awaiting_review`, `verified`, `failed`, `cancelled`, `superseded`. Evidence is append-only; derived state transitions are validated. A report of success is not verification.
- `ExecutionEvent`: `{ eventId, executionId, planRevisionId, unitId, attemptId, leaseEpoch, sequence, type, payloadHash, createdAt }`. Deduplicate `eventId`, enforce monotonic attempt sequence, and reject stale lease epochs with 409. Event payload schemas vary by type.
- `Evidence`: `{ id, unitId, planRevisionId, criterionIds, repositoryCommit?, artifactHash, verifierId, verificationDefinitionHash, environmentFingerprint, status, provenance, createdAt }`. Status is `passed | failed | not_run | waived`; provenance is `agent_report | trusted_runner | verified_ci | human_review`. Waivers require policy-authorized reviewers and reasons; agents cannot waive their own failures.
- `verified` requires every mandatory criterion to pass with allowed provenance at the exact revision/commit; later relevant changes invalidate it. `merged` and `released` are separate integration/release facts.
- Schedules derive from the unit DAG and available human/runner capacity. Store estimate ranges, uncertainty, timezone/calendar, external wait time, review capacity and resource locks. Undated “Day 1” is a session label; dated schedules are forecasts. Never start a dependent unit simply because its planned day has arrived.
- Parallelism is opt-in for units with compatible contracts and no declared write/resource conflicts. Each attempt has an isolated worktree/sandbox; integration is serialized and reverified. One planning writer per baseline remains the default even with parallel execution workers.

## Common API and storage rules for specs 47–65

- Route prefix is `/api/projects/[projectId]`. Unless stated otherwise: GET is member/read-token; POST/PATCH is session member; DELETE is owner or resource creator; policy, publication approval and external connection management are owner-only. All IDs must belong to that project. Lists use cursor pagination (default 50, maximum 100).
- New versioned-record writes require `expectedRevision` and `Idempotency-Key`. Success: reads 200, creation 201, enqueue 202, deletion 204. Shared errors: 400 invalid schema, 401 unauthenticated, 403 known member without action authority, 404 missing/foreign/inaccessible entity, 409 revision/lease/state conflict, 413 size, 422 readiness/semantic errors, 429 budget/rate, 503 provider unavailable. Introduce `unprocessable_entity` centrally with spec 47.
- Short transactions never hold database locks while calling providers. Migrations add indexes for project/revision lookups and explicit cascade/restrict behavior. Referenced approved revisions cannot be individually deleted; project erasure follows spec 63 retention/purge policy.
- Long work returns operation IDs and exposes persisted progress/cancellation. Partial outputs remain draft. Downloads and MCP reads use the same authorization, schemas and exact artifact resolver.
- Treat all documents, repository content and model output as untrusted. No script execution on import. Block archive traversal, absolute/drive paths, symlink escapes, duplicate normalized paths and case collisions. Cap compressed/decompressed bytes and entry counts before extraction.
- Defaults: source document 2 MiB, 100 documents per intake; package 5,000 entries/50 MiB uncompressed; one plan revision 1,000 leaf units with 50-unit pages. Larger programs split into explicitly linked plans with pinned interface revisions. No silent truncation or dropping of requirements to meet a limit.
- Every spec below inherits access-matrix, schema, cross-project-ID, idempotency and stale-revision tests. Add focused domain/failure tests named in the spec. Real integration/evaluation suites are separately configured and never use production data.

## Implementation slices

Specs 47–65 are capability milestones. Implement each as bounded sub-units: contracts/migration and pure logic; server/task behavior; UI/integration and evidence. Write a short sub-unit checklist in the tracker before implementation. Do not mark the milestone complete until every slice and acceptance check is done. Keep the dependency graph and release gates intact when splitting work.

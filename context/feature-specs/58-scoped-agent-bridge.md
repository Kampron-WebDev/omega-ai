# 58 — Scoped Agent Reporting and MCP Bridge

**Phase:** 10 · **Depends on:** 45, 46, 53, 54, 56, 57 · **Unlocks:** 59, 60, 62

## Goal

Let external coding agents fetch exact context, claim work, report blockers and submit evidence under explicit limited authority, completing the feedback loop.

## Read first

- `context/agentic-platform-contracts.md` and roadmap release gates.
- Token/MCP implementation, execution ledger, authorization helpers and current MCP protocol/security documentation.

## Install

Use existing dependencies; verify provider and protocol APIs before implementation.

## Environment

No new mandatory vendor configuration. Use shared validated environment and project policy; secrets never enter artifacts or logs.

## Implementation

1. Introduce an ExecutionCredential model and `lib/agent-access.ts`. Owner sessions issue an expiring credential tied to one execution/project/plan revision and a narrow scope set: context:read, units:claim, events:write, evidence:submit. Store only hashes; restrict maximum lifetime and allow immediate revocation.

2. Keep all existing personal access tokens read-only. Evaluate explicit bearer credentials deterministically; invalid supplied credentials fail instead of falling back to cookies. Execution credentials cannot manage tokens, policy, membership, baseline approvals or production actions.

3. Add MCP tools `get_execution_context`, `get_next_units`, `claim_unit`, `renew_claim`, `report_blocker`, `submit_evidence`, `complete_attempt` and `get_resume_context`. Reuse REST schemas/state transitions; tool descriptions are advisory, server checks enforce authority.

4. Require event IDs, sequences, lease epochs, revision/commit references and idempotency keys. Submitted agent evidence remains agent_report until validated by an allowed verifier. Provide a package-local event format for offline agents and a reconciliation preview on upload.

5. Build connection setup/testing and credential revocation UI. Add distributed rate limits to the bridge, Origin checks, bounded requests and protocol-version validation. Document the tested client/auth compatibility matrix; do not advertise standard OAuth discovery for a PAT-only endpoint. Never forward Omega tokens to model or repository providers.

## Contracts

ExecutionCredentials and shared event/error contracts; tools return structured data plus concise text, pagination cursors and exact revision IDs. `/executions/[id]/credentials` is owner/session-only. No broad write scope. Shared API, storage and access rules apply.

## Scope limits

No arbitrary shell tool or general-purpose project mutation API. OAuth support, if required by a supported client, needs an explicit separately reviewed implementation slice.

## Edge cases

Revocation while an agent is working, duplicate reconnect reports, wrong audience/project/revision, session-plus-token ambiguity and forged CI evidence.

## Tests

Full scope/access matrix, expired credentials, stale leases, revocation across server instances and REST/MCP parity. Verify at least two independent client integrations. Include shared authorization and revision checks.

## Check when done

- [ ] An external agent can claim, work, report and resume against pinned context.
- [ ] Neither read tokens nor execution credentials can escalate to policy or deployment authority.
- [ ] Definition of done and release gate; persist verification evidence and incomplete observations in the tracker.


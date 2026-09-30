# 60 — Pull Request Delivery and Integration

**Phase:** 11 · **Depends on:** 54, 56, 57, 58, 59 · **Unlocks:** 62, 63

## Goal

Deliver plans and agent changes as reviewable repository branches and pull requests, with trustworthy CI feedback and explicit merge authority.

## Read first

- `context/agentic-platform-contracts.md` and roadmap release gates.
- Repository connector, execution ledger, verification gates, provider check/webhook APIs.

## Install

Select and pin the minimum maintained provider SDKs needed by this spec; verify installed APIs. Do not install future integrations early.

## Environment

Reuse validated repository/runner configuration. New secrets must be optional until the integration is enabled and never appear in logs or exports.

## Implementation

1. Extend the repository provider adapter with narrow write capabilities granted separately by the owner. Create `lib/repository/delivery.ts`, `checks.ts` and `integration.ts`. Pin repository, base branch/commit, allowed paths and artifact hashes in a Delivery proposal.

2. Support pack-only pull requests first, then externally produced code branches. Show the exact patch and overwrite conflicts before publication unless that class of change is already preauthorized. Existing AGENTS/context files are merged through a reviewable proposal, never silently replaced.

3. Make branch/PR creation idempotent by execution/unit attempt. Use normal commits and compare expected HEAD; never force-push protected branches. On conflicts, record a blocked integration with the files and next action.

4. Verify CI results through authenticated provider APIs/webhooks, bound to repository, commit, trusted workflow identity and required check set. Ignore similarly named checks from untrusted workflows/forks. Merging creates an integration fact; rerun required integration checks after combining branches.

5. Build delivery preview, check status and review controls. Automated merge is disabled by default and requires explicit policy for repository/branch/checks. Deployment remains separate. Reconcile provider timeouts before creating duplicate PRs.

## Contracts

`Delivery { id, executionId?, planRevisionId, repositoryId, baseSha, headSha, patchHash, allowedPaths, prId?, status }`; `/deliveries` POST/GET, `/deliveries/[id]/publish` and `/integrate`. Owner approval or exact policy grant required for external writes. Shared API/storage/access rules apply.

## Scope limits

No default main-branch push, no approval derived from an LLM response, no claim that a merged branch is deployed.

## Edge cases

Base branch advances, required check belongs to old SHA, provider timeout after PR creation, connection revoked and conflicting independently verified units.

## Tests

Publication retry/reconciliation, path restrictions, branch divergence, forged checks, old-SHA green CI and integration regression. Include shared auth, idempotency and stale-revision checks.

## Check when done

- [ ] Exported plans and code changes arrive as reviewable PRs with exact provenance.
- [ ] Integration status is distinct from unit verification and production release.
- [ ] Relevant release gate and definition of done; record exercised integrations and remaining limits.


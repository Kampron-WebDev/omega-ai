# 59 — Existing Repository Intake and Drift

**Phase:** 11 · **Depends on:** 48, 49, 50, 53, 58 · **Unlocks:** 60, 62

## Goal

Plan extensions, migrations and repairs against the software that already exists, preserving its conventions and distinguishing observed code from inferred design.

## Read first

- `context/agentic-platform-contracts.md` and roadmap release gates.
- Source ingestion, baselines, profiles, execution credentials and repository provider documentation selected for the integration.

## Install

Select and pin the minimum maintained provider SDKs needed by this spec; verify installed APIs. Do not install future integrations early.

## Environment

Optional GitHub App configuration: `GITHUB_APP_ID`, `GITHUB_APP_PRIVATE_KEY`, `GITHUB_WEBHOOK_SECRET`. Server-only and checked only when repository integration is enabled; installation tokens are short-lived.

## Implementation

1. Create `types/repository.ts`, `lib/repository/provider.ts`, `intake.ts` and `prisma/models/repository.prisma`. Owner-authorized connections select explicit repositories and read-only contents permission for intake. A bounded uploaded archive is a provider-independent alternative.

2. Snapshot an exact commit/tree. Inventory manifests, lockfiles, module boundaries, schemas, tests, CI, instructions and existing architecture. Exclude secrets, dependencies, generated binaries and vendor trees by default; record exclusions and byte limits. Do not run install hooks, tests, scripts or imported agent instructions.

3. Build source-linked facts and proposed architecture/requirements. Separate observed, inferred and unknown; cite file path and commit for every observation. Existing setup replaces the greenfield scaffold unit with a reproduce-and-baseline unit.

4. Add `lib/repository/drift.ts`: compare accepted baseline with a new commit and propose affected requirements/contracts/units. Repeated intake is idempotent; out-of-order webhook events do not rewind the current commit. Verify webhook signatures and membership at ingestion and retrieval.

5. Build a repository intake preview with selected source, exclusions, detected toolchain, current failures if trusted evidence exists, confidence and adoption diff. Apply proposals through spec 50; preserve human-authored constraints.

## Contracts

`RepositorySnapshot { id, repositoryId, commitSha, treeHash, sourceManifestHash, exclusions, facts[] }`; `/repository-connections`, `/repository-intakes` POST/GET and `/repository/drift`. Archive intake follows shared file limits and rejects links/path escapes. Shared API/storage/access rules apply.

## Scope limits

No arbitrary Git URL fetch or local network access; no code execution; no repository writes. Intake does not claim to discover every requirement.

## Edge cases

Monorepo, submodule/LFS pointers, fork permissions, renamed files, secret-containing source, deleted installation and instructions that request exfiltration.

## Tests

Pinned-commit intake, webhook replay/signature/order, source citations, inaccessible repos, malicious archive and fixtures for migration versus greenfield plans. Include shared auth, idempotency and stale-revision checks.

## Check when done

- [ ] An existing project generates a change plan using observed files and conventions.
- [ ] Untrusted repository content never executes during intake.
- [ ] Relevant release gate and definition of done; record exercised integrations and remaining limits.


# 61 — Isolated Execution Runtime

**Phase:** 11 · **Depends on:** 48, 56, 57, 58, 59 · **Unlocks:** 62

## Goal

Provide an optional controlled environment for coding agents to build and test without giving project code access to Omega's application credentials or host.

## Read first

- `context/agentic-platform-contracts.md` and roadmap release gates.
- Execution policies/ledger, verification definitions, repository intake and the chosen sandbox provider's security and lifecycle documentation.

## Install

Select and pin the minimum maintained provider SDKs needed by this spec; verify installed APIs. Do not install future integrations early.

## Environment

Provider-specific sandbox credentials and limits are chosen in a recorded architecture decision before this implementation. Keep them server-only; no broad credential is injected into project runtimes.

## Implementation

1. Define `lib/execution/runner.ts` capability interface and `types/runner.ts`: create, inspect, execute approved command, collect artifacts, stop, destroy. Implement one isolated provider first plus a deterministic fake; provider selection requires a threat/capability evaluation, not a speculative collection of adapters.

2. Each attempt gets an ephemeral isolated filesystem/worktree pinned to a commit, a resource budget (CPU/memory/disk/time), unprivileged runtime and explicit network egress policy. Deny host mounts, container sockets, metadata endpoints and access to other projects.

3. Inject only approved short-lived task credentials through a secret broker; redact output and never persist secrets in snapshots or packs. Generated instructions cannot request wider access. Network installs and package lifecycle scripts are execution operations under policy, not harmless intake.

4. Persist command intents, process IDs, exit status, environment fingerprints and bounded output hashes. On timeout/cancel/revocation kill the process tree, deny further egress and reconcile effects before destroying the runtime. Use a janitor for abandoned environments.

5. Add capability preflight and runner status UI. A missing macOS, device/GPU or proprietary toolchain yields unsupported/manual verification, not a false pass. Setup cost and idle time count toward the execution budget.

## Contracts

`RunnerCapabilities { os, architecture, toolchains, browser, gpu, networkPolicy, isolationLevel }`; `CommandRequest { executable, args[], cwd, timeout, resourceLimits, approvedSecretRefs[] }`; internal runner API is unavailable through arbitrary public MCP commands. Shared API/storage/access rules apply.

## Scope limits

No execution inside Next.js route workers or the application host. No production database/network access by default.

## Edge cases

Fork bomb, disk exhaustion, secret output, malicious package postinstall, sandbox API timeout, orphaned process and unsupported platform.

## Tests

Security integration suite for tenant isolation, host/network denial, resource limits, process-tree termination, credential revocation and cleanup; fake-runner unit tests remain offline. Include shared auth, idempotency and stale-revision checks.

## Check when done

- [ ] Malicious fixture code cannot cross the documented isolation or credential boundary.
- [ ] Stopped executions leave no active workers or reusable project secrets.
- [ ] Relevant release gate and definition of done; record exercised integrations and remaining limits.


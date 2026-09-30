# Roadmap assessment — 2026-09-30

## Verdict

The original roadmap is a strong architecture-workspace MVP, but following specs 01–46 alone would not deliver a reliable, general-purpose agentic software-building platform. It ends at a generated plan and read-only handoff. It does not establish complete requirements, reproducible input versions, resumable implementation, trustworthy verification, or execution authority.

The revised roadmap preserves that useful foundation, repairs its correctness gaps, and adds specs 47–65. These are planned capabilities, not completed implementation. The next implementation remains spec 22. A roadmap can define an excellent product; only demonstrated outcomes on real projects can establish that the shipped product is excellent.

## Evidence from this repository

- All 46 original feature specs were reviewed, alongside the context documents, source-tree inventory, data/access helpers, collaboration boundary, canvas and AI UI, dependencies, and CI configuration. This is a product and architecture review, not a line-by-line security audit of every component.
- The tracker marks 01–21 complete. The code matches that boundary: `components/editor/ai-architect-tab.tsx` holds local messages, `ai-specs-tab.tsx` is a static demo, Prisma contains projects/collaborators, and no `trigger/` implementation exists yet.
- The prior local verification passed lint, TypeScript, 68 unit tests, and build. Those checks do not prove authenticated collaboration, generated-plan quality, or agent delivery. The tracker explicitly records missing browser and two-user observations.
- Existing strengths worth retaining: explicit context files, incremental specs, access-checked routes, one canvas validator, deterministic layout and graph-derived output, durable tasks, checkpoints, safe Markdown, and a portable handoff folder.

## Gaps and their disposition

| Gap | Why it matters | Resolution |
| --- | --- | --- |
| Snapshot hashes include changing save metadata; concurrent saves can publish older state | The save indicator can lie or durable data can regress | Correct spec 25: content hashes, serialized save publication, explicit invalid-state errors |
| Check-then-trigger run admission; worker can start before its row exists | Duplicate runs, lost tracking, uncertain retries | Correct 31–34: transactional reservation, outbox, leases, monotonic transitions and attempt fencing |
| Client-writable feeds treated as authenticated chat/status | A forged assistant message can contaminate context and impersonate system state | Correct 29–30: durable server records; feeds carry notifications, never authority |
| AI changes and later human edits share an unsafe restore path | A retry or undo can discard another person's work | Correct 26/33: stable checkpoint/run relation, atomic conditional edits, conflict-aware inverse changes |
| Export combines a saved plan with live graph/latest spec | The folder can contradict itself | Correct 35–40: immutable generation input and linked spec; richer baselines in 50 |
| 5–40 units and warning-only coverage | Small tools are overplanned; large projects hide missing work | Correct 39; full hierarchical dependency planning in 51 |
| No clarification, durable decisions, acceptance criteria or requirement IDs | Agents must invent product behavior | 47 and 49 |
| Web/service-centric design | CLI, native, library, data and hardware projects need different contracts | 48–49 with explicit support tiers |
| No days, capacity, handover or progress reconciliation | Work cannot resume reliably across sessions and agents | 52–54 and 57–58 |
| No autonomous planning controller | Several buttons do not form a bounded autonomous workflow | 55 |
| A unit can be called done without evidence | Passing prose or self-reported status can hide broken software | 56–58 and 64 |
| No existing-repository workflow or reviewable delivery | Most valuable engineering work extends existing software | 59–60 |
| No isolated runtime or permission model for code execution | Planning autonomy would be confused with authority to run/deploy code | 61–62, separate from planning release |
| Late-only hardening, no launch evidence | Building every feature can still ship an unreliable service | Strengthened 44; 63–65 and release gates |

## Product boundaries

Omega should be the system of record for intent, architecture, contracts, plans, evidence and progress. Coding agents should receive an exact, versioned context package and a verifiable next action. The canvas is one view of the system; it is not the sole representation of requirements or delivery state.

Support three explicit modes: manual planning, collaborative planning with proposals, and autonomous planning within a user-defined policy. Autonomous planning can finish a build-ready package without repeated approvals for routine decisions. An unresolved blocking constraint produces `needs_input` or a draft package; it must not fabricate an answer. Autonomous code execution is a later, separately enabled capability.

“All forms of software development” is a direction, not a release claim. Start with evaluated profiles for web applications, services/APIs, CLI/libraries, then expand to mobile/desktop, data/ML, infrastructure, games and embedded systems. A profile without a working toolchain, contracts and acceptance fixtures is experimental. Safety-critical and regulated applications need domain experts and domain-specific evidence; a generic architecture review is insufficient.

## Release gates

1. **Architecture and handoff preview:** specs 22–46, including the corrections in this review. Demonstrate authenticated two-user collaboration, save/restore, AI cancellation/recovery, immutable export and access isolation. Label generated packages draft when readiness evidence is incomplete. Spec 44 includes the preview browser/security gate.
2. **Planning platform:** specs 47–56 plus the planning portions of 63–65. A new agent can unpack a ready package, implement a bounded representative application, and resume after interruption without reconstructing requirements. Plans include acceptance coverage, contracts, setup, risks and capacity-aware work sessions. External execution integrations are not required for this gate.
3. **Connected delivery:** specs 57–60 plus applicable 63–65 gates. Existing repositories can be assessed without executing untrusted code, units are claimed with expiring leases, CI evidence is bound to commits, and delivery is a reviewable pull request.
4. **Managed execution:** specs 61–65. Demonstrate sandbox isolation, budget enforcement, revocation, recovery after worker failure, conflict-safe parallel branches and verified integration. Hosted execution remains unavailable until this gate passes.

Numeric order is the implementation default. Release-specific validation slices from 63–65 are pulled forward into the release they protect; record the slice and leave the parent spec incomplete. This is not permission to ship early capabilities without their quality gates.

## What a complete package means

The package contains product scope, traceable requirements, accepted assumptions and decisions, architecture views, relevant interface/data/UX contracts, environment and dependency instructions, executable verification definitions, threat and operational plans, stable implementation units, dependency graph, milestones/day-sized sessions, current state, resumption instructions, provenance and integrity hashes. Applicable items can be explicitly `not_applicable` with a reason; invented boilerplate does not satisfy readiness.

“Day” is a capacity bucket or dated work session, not a guaranteed AI completion time. Estimates include ranges, confidence, review time and external waits. Large programs use bounded subsystems and paginated context, not a single unbounded model call. Work that does not fit is split by testable contracts rather than compressed into vague oversized units.

## Research used to challenge the design

- [Anthropic: effective harnesses for long-running agents](https://www.anthropic.com/engineering/effective-harnesses-for-long-running-agents): supports incremental tasks, durable handover and end-to-end checks across fresh sessions. It does not prove universal autonomous development; the roadmap therefore adds cross-profile evaluation.
- [Anthropic: demystifying evaluations for AI agents](https://www.anthropic.com/engineering/demystifying-evals-for-ai-agents): informs repeatable task suites and outcome-based scoring instead of judging only generated text.
- [MCP security best practices](https://modelcontextprotocol.io/docs/2025-11-25/tutorials/security/security_best_practices): informs credential isolation and explicit authorization boundaries; check the then-current protocol before implementation.
- [NIST SSDF 1.1](https://www.nist.gov/publications/secure-software-development-framework-ssdf-version-11-recommendations-mitigating-risk): informs security requirements and verification throughout delivery, rather than a final hardening checkbox. This is an engineering reference, not a certification claim.

The detailed contracts, limits and release targets in this roadmap are Omega design decisions, not guarantees or requirements attributed to these sources.

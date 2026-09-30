# 53 — Versioned Context and Source Provenance

**Phase:** 9 · **Depends on:** 47, 49, 50, 51 · **Unlocks:** 54, 55, 59

## Goal

Give each agent the smallest sufficient, version-correct context for its unit while retaining exact requirements and sources on large projects.

## Read first

- `context/agentic-platform-contracts.md` and roadmap release gates.
- Baseline, requirements and contract stores; `lib/ai/limits.ts`; spec 46 MCP handlers.

## Install

Use existing packages; select maintained validators/archive tooling only where required and verify their installed APIs.

## Environment

No new required variables. Optional integrations must validate configuration at their boundary.

## Implementation

1. Create `types/context-source.ts`, `lib/context/ingest.ts`, `select.ts` and `index.ts`. Accept Markdown, plain text and structured contract files first; preserve immutable source bytes, source kind, license/access metadata, content hash and project scope. Archive imports follow shared limits and path rules.

2. Index explicit references and headings before introducing vector search. Select accepted constraints and policies, unit dependencies, relevant decisions, contracts, tests and source snippets in that priority order. Every selected item names its baseline/revision/hash and trust level.

3. Provide `resolveUnitContext` with an explicit token budget and manifest of included/omitted items. Mandatory material never disappears silently; partition work or return insufficient-context with blockers. Summaries reference originals and cannot become new authorities.

4. Add source listing and preview in `components/editor/context-sources-panel.tsx`. Uploading data never executes it. No automatic fetch of model-supplied URLs; future fetchers must enforce approved sources, address/redirect restrictions and size limits.

5. Extend read APIs/MCP with exact-revision context index and bounded file/section reads. Paginate at section boundaries; return continuation cursors and hashes. Invalidate derived indexes on deletion/revocation.

## Contracts

`ContextBundle { baselineId, unitId, budget, entries: [{ sourceId, revision, hash, trust, range }], omitted[], blockers[] }`. `/sources` POST/GET; `/plans/[id]/units/[unitId]/context` GET; `get_unit_context` MCP read tool. Shared API/storage/access rules apply.

## Scope limits

No general web crawler and no execution of attachments. Vector storage is optional only after measured retrieval gaps.

## Edge cases

Prompt injection in a README; same filename in two sources; cross-project search leakage; oversized mandatory contract; deleted or superseded source.

## Tests

Cross-project isolation, provenance preservation, critical-context retention, retrieval determinism and exact reassembly from paginated reads. Include shared authorization/revision tests.

## Check when done

- [ ] A fresh agent receives exact applicable constraints and can retrieve their originals.
- [ ] Large inputs are partitioned explicitly rather than silently truncated.
- [ ] Definition of done and relevant release gate; record slices and verification in the tracker.


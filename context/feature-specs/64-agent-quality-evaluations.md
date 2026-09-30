# 64 — Agent Quality Evaluations and Dogfooding

**Phase:** 12 · **Depends on:** 48, 54, 55, 56, 58, 62, 63 · **Unlocks:** 65

## Goal

Measure whether Omega produces usable plans and working software across supported profiles, rather than grading only plausible prose or happy-path demos.

## Read first

- `context/agentic-platform-contracts.md` and roadmap release gates.
- `docs/ai-evals/design.md`, profile support levels, package readiness, execution evidence and `context/roadmap-assessment.md`.

## Install

Choose maintained tooling for the named validation capabilities at implementation time; keep live integration and evaluation tooling separate from ordinary unit tests.

## Environment

Dedicated non-production test/provider credentials where needed, optional until the capability is enabled. Document every new variable in the validated environment and example file; do not put secrets in fixtures.

## Implementation

1. Create `evals/fixtures/`, `evals/rubrics/`, `evals/run.ts` and `docs/evaluation-results.md`. Begin deterministic fixtures at spec 33; add planning-only cases when 54–56 land and execution cases when runners exist. Ordinary unit CI remains offline.

2. Cover at least 12 versioned scenarios: web app, API, CLI/library, native profile, data pipeline, infrastructure, existing-repo change, migration, ambiguous constraints, hostile repository content, interrupted multi-day work and a large 250-unit planning program. Unsupported toolchains are reported as unsupported, not counted as passes.

3. Separate structural quality (schema, coverage, references), task success (criteria verified), security/authority failures, human intervention, recovery behavior, cost and duration. Score from recorded outcomes and independent rubric review, not solely by the generator grading itself. Freeze holdout fixtures and report model/prompt/profile versions.

4. Run each supported planning scenario three times for model-changing releases; proposed gate is 100% structural and authorization invariants, no false-ready/false-complete result, and at least 90% of applicable task checks passing. Report denominators and per-profile results; high-severity failures block release regardless of the average. Rebaseline thresholds only through a recorded decision.

5. Dogfood Omega's own next bounded feature through exported context and a fresh coding agent. Compare delivered behavior against original acceptance criteria, including a deliberate context reset. Record defects and turn repeatable ones into regression fixtures. Keep reference tests and protected criteria independent from the agent's writable workspace.

## Contracts

`EvalRun { fixtureVersion, modelVersion, promptVersion, profileVersion, baselineHash, seed?, attempts, metrics, evidenceRefs, failures }`; store private evidence separately from publishable aggregate results. Paid live runs require an explicit evaluation budget, not production user data. Shared access, storage and API conventions apply.

## Scope limits

No universal capability claim from a small benchmark; no guarantee from one successful demo; no hiding failed attempts.

## Edge cases

Flaky tools, stochastic output, unsupported platforms, leaked holdout solutions, judge disagreement and a faster but less correct model.

## Tests

Rubric scoring, report aggregation, independent verification, replay fixtures and comparison against stored baselines. Test the evaluator with intentionally broken packages and false completion claims.

## Check when done

- [ ] Supported profiles have reproducible results, costs and known failure modes.
- [ ] Omega's own exported workflow survives a fresh-agent handover and builds a real bounded feature.
- [ ] Definition of done and release-gate evidence recorded. Pull forward applicable validation slices before earlier releases; this parent milestone stays incomplete until all slices are done.


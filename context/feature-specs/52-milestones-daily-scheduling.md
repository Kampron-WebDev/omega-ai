# 52 — Milestones, Daily Sessions and Capacity

**Phase:** 9 · **Depends on:** 51 · **Unlocks:** 54, 55, 57

## Goal

Turn the dependency graph into realistic milestones and day-sized work sessions, including human review, external waits and uncertain estimates.

## Read first

- `context/agentic-platform-contracts.md` and roadmap release gates.
- `lib/build-plan/graph.ts`, plan v2 contracts and `context/agentic-platform-contracts.md` scheduling rules.

## Install

Use existing packages; select maintained validators/archive tooling only where required and verify their installed APIs.

## Environment

No new required variables. Optional integrations must validate configuration at their boundary.

## Implementation

1. Create `types/schedule.ts`, `lib/scheduling/critical-path.ts`, `lib/scheduling/allocate.ts` and a versioned schedule artifact. Inputs include timezone, working days/hours, human review capacity, agent slots, unit effort ranges and external milestones.

2. Allocate ready units deterministically in dependency order, honoring shared-resource/write-area locks and integration reviews. Mark a unit larger than a session as requiring a split; do not silently exceed capacity. Produce earliest/range forecasts and critical-path blockers, not precise invented completion dates.

3. Support undated Day 1/Day 2 sessions and dated calendars. Record estimation source/confidence, machine time versus human review time, and dependencies that require credentials, hardware or vendor action.

4. Build `components/editor/schedule-panel.tsx`: milestone timeline, session checklist, capacity inputs, blockers, forecast ranges and move/split proposals. A deadline that cannot be met produces options to reduce scope, increase capacity or move the date, with impacts shown.

5. Persist revisions and export Markdown session plans plus machine-readable JSON. After spec 57, reforecast from actual events without moving completed work or silently accepting a new schedule.

## Contracts

`ScheduleRevision { planRevisionId, assumptions, timezone, capacity, sessions[], forecastRange, blockers[] }`; `Session { id, ordinal, date?, unitIds[], entryCriteria[], exitCriteria[], handover }`. `/plans/[id]/schedule` GET/POST; conflicting capacity constraints return 422 with explanations. Shared API/storage/access rules apply.

## Scope limits

No promise that a software project finishes on a named date. No worker may start solely because its calendar slot arrived.

## Edge cases

Daylight saving, weekends, unavailable reviewer, uncertain external API approval, zero capacity and mid-project scope additions.

## Tests

Dependency ordering, capacity/resource safety, deterministic allocation, impossible deadlines, reviewer bottlenecks and timezone boundary fixtures. Include shared authorization/revision tests.

## Check when done

- [ ] A multi-day plan has prerequisites, outcomes and handover for each session.
- [ ] Forecasts expose uncertainty and never schedule blocked work as executable.
- [ ] Definition of done and relevant release gate; record slices and verification in the tracker.


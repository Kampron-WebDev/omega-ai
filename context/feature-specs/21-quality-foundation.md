# 21 — Quality Foundation

**Phase:** 4 · Foundations · **Depends on:** 01–20 · **Unlocks:** every later spec

## Goal

Give every later unit a test runner, a declared validation library, validated environment variables, and a CI pipeline, so that "done" means the same thing for every spec: lint, typecheck, tests, and build all pass. Today nothing is tested automatically, `zod` resolves only by hoisting luck, and a missing environment variable surfaces deep inside a request.

## Read first

- `context/code-standards.md`, `context/ai-workflow-rules.md`, and `context/feature-specs/README.md` (the definition of done)
- `lib/prisma.ts` and `lib/liveblocks.ts`, which read environment variables directly today
- `lib/slug.ts`, `lib/email.ts`, `lib/initials.ts`, `lib/canvas-drag.ts`, `lib/project-input.ts`, and `lib/api-response.ts`: the pure modules that get tests first
- `prisma7.config.ts`, for how `DATABASE_URL` is loaded outside Next.js

## Install

- dependencies: `zod`, `server-only`
- devDependencies: `vitest`, `vite-tsconfig-paths`, `jsdom`, `@testing-library/react`, `@testing-library/dom`

Pin with the same style as the existing `package.json`. Check that the zod version you install is the one `import { z } from "zod"` resolves to (the tree also contains older transitive copies).

## Implementation

1. **Scripts.** Add to `package.json`:
   - `typecheck`: `tsc --noEmit`
   - `test`: `vitest run`
   - `test:watch`: `vitest`
   - `check`: runs `lint`, `typecheck`, and `test` in sequence

2. **Vitest config.** Create `vitest.config.mts`:
   - `vite-tsconfig-paths` plugin, so `@/` imports resolve
   - default environment `node`. Hook and component tests opt in with a `// @vitest-environment jsdom` header.
   - include `**/*.test.{ts,tsx}`; exclude `node_modules`, `.next`, and `generated`
   - tests sit next to the module they test (`lib/slug.test.ts`)

3. **Validated environment.** Create `lib/env.ts`:
   - starts with `import "server-only"`
   - a zod schema for the server variables that exist today: `DATABASE_URL`, `LIVEBLOCKS_SECRET_KEY`, `CLERK_SECRET_KEY`, `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY`
   - exports `getServerEnv()`. It parses `process.env` on first call, caches the result, and throws one error that lists **every** missing or invalid variable by name (never their values).
   - it must not run at import time: `next build` imports route modules without the full environment.
   - later specs add their variables to this schema. A variable only one optional feature needs is `.optional()` and checked where it is used.

4. **Adopt it.** Switch `lib/prisma.ts` and `lib/liveblocks.ts` to `getServerEnv()`. Keep their lazy-construction and `globalThis` caching exactly as they are.

5. **`.env.example`.** Commit a `.env.example` that lists every variable with a one-line comment and no values. Make sure `.gitignore` ignores `.env*` but not `.env.example`.

6. **Tests for existing pure logic.** Cover at least:
   - `slugify`: empty input, unicode, runs of separators, the `MAX_SLUG_LENGTH` cut-off
   - `normalizeEmail`: case and whitespace
   - `initialsFromName`: one word, several words, empty
   - `parseCanvasShapeDragPayload`: valid payload, unknown shape, malformed JSON
   - every parser in `lib/project-input.ts`: the valid path and each rejection message
   - `lib/api-response.ts`: each code maps to its status and body shape

7. **Continuous integration.** Create `.github/workflows/ci.yml`:
   - triggers: push to `development` and `main`, and pull requests
   - Node version: whatever `@types/node` and the local toolchain target. Record the choice in the workflow file.
   - steps: `npm ci`, then `npm run lint`, `npm run typecheck`, `npm test`
   - `postinstall` runs `prisma generate`, which needs a syntactically valid `DATABASE_URL`. Set a placeholder URL in the workflow env; generate does not connect.
   - a separate `build` job runs `npm run build` with Clerk and Liveblocks keys from repository secrets. If the secrets are absent it skips with a clear message instead of failing.
   - `npm audit --omit=dev --audit-level=high` runs as a non-blocking step for now (spec 44 makes it blocking).

8. **Docs.** Add a "Development" section to `README.md`: required environment variables, `npm run check`, and how CI works.

## Contracts

```ts
// lib/env.ts
interface ServerEnv {
  DATABASE_URL: string
  LIVEBLOCKS_SECRET_KEY: string
  CLERK_SECRET_KEY: string
  NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY: string
}
function getServerEnv(): ServerEnv
```

## Scope limits

- Do not rewrite the hand-rolled validators in `lib/project-input.ts` to zod. They are tested, not replaced. New code uses zod.
- No end-to-end browser tests yet. Playwright needs Clerk test users, which write to the user's Clerk instance; that is a separate decision.
- No coverage thresholds.

## Edge cases

- `next build` must pass with the environment it has today. Nothing may call `getServerEnv()` at module top level.
- Tests must not need a database or network. Mock `@/lib/prisma` and Clerk where a route is under test.

## Tests

The tests listed in step 6, plus `lib/env.test.ts`: a complete environment parses, and a partial one throws an error naming each missing key.

## Check when done

- [ ] `npm run check` passes locally; `npm run build` passes.
- [ ] CI runs on a push and is green (or the build job reports that secrets are missing).
- [ ] `lib/prisma.ts` and `lib/liveblocks.ts` read from `getServerEnv()`.
- [ ] `.env.example` lists every variable the app reads.
- [ ] `code-standards.md` testing rules are followed by the new tests.

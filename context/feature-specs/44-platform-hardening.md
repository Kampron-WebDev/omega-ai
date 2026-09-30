# 44 — Platform Hardening

**Phase:** 7 · Platform · **Depends on:** 21–43 · **Unlocks:** 45, 46, production readiness

## Goal

Close the gaps between "works" and "safe to run for real users": security headers, friendly error pages, a health endpoint, consistent structured logging on every route, request size limits, a migration off Clerk's deprecated route matcher, and a blocking dependency audit in CI.

## Read first

- `proxy.ts` and the Clerk deprecation note in `progress-tracker.md`
- `next.config.ts` and the Next.js docs in `node_modules/next/dist/docs/` for `headers()`, `error.tsx`, `global-error.tsx`, and `not-found.tsx` in this version
- `lib/logger.ts` (spec 34) and `lib/api-response.ts`

## Implementation

1. **Security headers** in `next.config.ts` `headers()`, for all routes:
   - `X-Content-Type-Options: nosniff`
   - `Referrer-Policy: strict-origin-when-cross-origin`
   - `X-Frame-Options: DENY`
   - `Permissions-Policy` disabling camera, microphone, and geolocation
   - `Strict-Transport-Security` in production only
   - **CSP in `Content-Security-Policy-Report-Only` during validation.** Measure the actual Clerk, Liveblocks and Trigger.dev origins; browser Blob origins are unnecessary because content is proxied through authorized routes. Verify font delivery instead of assuming Google-hosted requests. Resolve violations and enable enforcement on the release candidate with rollback instructions.

2. **Error surfaces.**
   - `app/global-error.tsx`, `app/error.tsx`, and `app/editor/[roomId]/error.tsx` (canvas-specific: "Something went wrong loading this workspace", with Retry and Back to projects), plus `app/not-found.tsx`.
   - Token-styled, with no stack traces. A digest ID is shown for support.

3. **Health endpoint: `GET /api/health`** (public).
   - `{ status: "ok" | "degraded", checks: { database: "ok" | "fail" } }`, via a `SELECT 1` with a 2 s timeout.
   - No versions, no environment names, no secrets.
   - `Cache-Control: no-store`.

4. **Request logging.**
   - A `withRoute(handler, { name })` wrapper in `lib/route.ts` gives every `app/api` handler a request ID (`x-request-id`, echoed in the response), a duration, a status, and structured logs through `lib/logger.ts`.
   - It turns unexpected throws into `500 internal` (add the code) with the request ID and no internals.
   - Apply it to every existing route.

5. **Size limits.** Bound the request stream before parsing, regardless of `Content-Length`; default 64 KB, canvas import 2 MB. Bound uploaded/output artifacts too. Session-authenticated mutations validate Origin/CSRF protections; a cross-site request cannot use a browser session to start paid work or mutate a project.

6. **Clerk migration.** Replace `createRouteMatcher` in `proxy.ts` with resource-level checks. Page routes (`/editor`, `/editor/[roomId]`) call `auth()` and redirect to sign-in themselves. The proxy keeps only what Clerk still requires for session handling. Verify the redirect behavior for signed-out users on each page route by hand, and record it.

7. **CI.** Make `npm audit --omit=dev --audit-level=high` blocking. Add a check that fails if `.env*` files other than `.env.example` are tracked.

8. **Preview release gate.** Add a dedicated isolated browser/integration suite for authenticated create/open/share/revoke, two-user collaboration, snapshot/checkpoint recovery, AI cancel/retry and immutable export. Provision only authorized test identities in non-production infrastructure; missing test credentials make this gate unverified, not passed. Test blank optional auth-path environment values so they cannot broaden public routes. Ensure the production build actually runs in the release job; a skipped secret-dependent build is not release evidence.

9. **Access revocation and storage.** Verify how existing Liveblocks connections are disconnected or their permissions expire when membership is removed; test the observed revocation bound. Revalidate task requester membership before effects. Private blobs, prompt/output redaction, centralized request errors and critical authority checks apply when each earlier feature lands, not only at spec 44. Review provider and worker environments separately from Next.js.

## Scope limits

- No third-party error tracking (Sentry and the like). That needs the user's choice of vendor; add it to Open Questions.
- Enforce CSP on the release candidate after required origins are measured and violations resolved; report-only remains available for controlled rollout, but it is not a substitute for the release security assessment.

## Edge cases

- The health check must not require auth, and must not be cached by any CDN.
- Error pages must render even when Clerk failed to load (no Clerk components in `global-error.tsx`).

## Tests

- `withRoute`: adds the request ID, maps a throw to 500 without leaking the message, and logs a duration.
- Size limit: 64 KB + 1 → 413; the import route accepts 1.5 MB.
- The health route: ok and degraded, with Prisma mocked.

## Check when done

- [ ] Headers are present on every response (check with `curl -I`).
- [ ] Every API route is wrapped; responses carry `x-request-id`.
- [ ] `createRouteMatcher` is gone and signed-out redirects still work.
- [ ] CSP report-only violations are reviewed and recorded.
- [ ] Definition of done in `context/feature-specs/README.md`.

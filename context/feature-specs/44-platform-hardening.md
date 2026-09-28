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
   - **CSP in `Content-Security-Policy-Report-Only` first.** List the origins the app actually uses: Clerk (frontend API and images), Liveblocks (API and WebSocket), Trigger.dev realtime, Vercel Blob (none; the browser never loads blobs), and Google Fonts if used. Record the observed violations in the tracker. Switching to enforcing mode is a separate, explicit decision.

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

5. **Size limits.** `readJsonObject` (and the zod parsing path) rejects bodies over 64 KB with `413 payload_too_large`, except routes that set a higher limit explicitly (canvas import: 2 MB).

6. **Clerk migration.** Replace `createRouteMatcher` in `proxy.ts` with resource-level checks. Page routes (`/editor`, `/editor/[roomId]`) call `auth()` and redirect to sign-in themselves. The proxy keeps only what Clerk still requires for session handling. Verify the redirect behavior for signed-out users on each page route by hand, and record it.

7. **CI.** Make `npm audit --omit=dev --audit-level=high` blocking. Add a check that fails if `.env*` files other than `.env.example` are tracked.

## Scope limits

- No third-party error tracking (Sentry and the like). That needs the user's choice of vendor; add it to Open Questions.
- No enforcing CSP in this unit.

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

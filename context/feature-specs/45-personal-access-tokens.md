# 45 — Personal Access Tokens

**Phase:** 7 · Platform · **Depends on:** 44 · **Unlocks:** 46

## Goal

Let a developer give tools (their coding agent, the MCP server in spec 46, scripts) read access to their Omega projects without sharing a browser session. Tokens are created once, shown once, stored only as hashes, scoped read-only, expiring, and revocable.

## Read first

- `lib/project-access.ts` (`getCurrentIdentity`) and `lib/projects.ts`: token auth must resolve to the same `ProjectIdentity`, so every existing access rule applies unchanged
- `lib/route.ts` (spec 44)
- Node's `crypto` (`randomBytes`, `createHash`, `timingSafeEqual`)

## Implementation

1. **Model** in `prisma/models/api-token.prisma`:

   ```prisma
   model ApiToken {
     id         String    @id @default(cuid())
     userId     String
     name       String
     prefix     String    // first 8 chars after "omg_", shown in the UI
     hash       String    @unique // sha256 of the full token
     scopes     String[]  // ["read"] only in this unit
     expiresAt  DateTime
     lastUsedAt DateTime?
     revokedAt  DateTime?
     createdAt  DateTime  @default(now())

     @@index([userId, createdAt])
   }
   ```

2. **`lib/api-tokens.ts`.**
   - `createApiToken(userId, { name, expiresInDays })`: `expiresInDays` is 7, 30, 90, or 365. The token is `omg_` plus 32 random bytes in base64url. Store the hash and return the plaintext **once**.
   - `verifyApiToken(bearer)`: hash, look up, reject if revoked or expired, then update `lastUsedAt` (throttled to once a minute per token).
   - At most 20 active tokens per user.

3. **Identity resolution.**
   - `getRequestIdentity(request)` in `lib/project-access.ts` returns the Clerk session identity, or, when an `Authorization: Bearer omg_…` header is present, the token owner's identity. The email is resolved through the Clerk Backend API and cached for 5 minutes per user.
   - Token identities carry `via: "token"` and `scopes`.
   - **Mutating routes reject token identities** with `403`. Only routes explicitly marked read-only accept them. Default deny.

4. **Routes** (session only; a token cannot manage tokens):
   - `GET /api/tokens` → a list without hashes
   - `POST /api/tokens` with `{ name, expiresInDays }` → `201 { token, apiToken }`, where `token` is the plaintext, returned once
   - `DELETE /api/tokens/[id]` → revoke (sets `revokedAt`)

5. **Settings page: `/settings/tokens`.**
   - Reached from the Clerk `UserButton` menu (a custom menu item) and from the editor home.
   - Lists name, prefix, created, expires, last used, and status.
   - The create dialog shows the token once, with a copy button and a warning that it cannot be shown again.
   - Revoke asks for confirmation.

6. **Read access for tokens.** Mark these existing routes as token-readable:
   - `GET /api/projects`
   - `GET …/specs`, `GET …/specs/[id]`, `GET …/specs/[id]/download`
   - `GET …/plans`, `GET …/plans/[id]`, `GET …/plans/[id]/export`
   - `GET …/canvas/export`
   - `GET …/reviews/latest`

## Scope limits

- Read scope only. No write scopes, no organization tokens, no OAuth apps.

## Edge cases

- A token for a user who was removed as a collaborator immediately loses that project, because access is evaluated per request, exactly as for sessions.
- A timing-safe comparison is not needed after a unique-hash lookup, but never log token values or hashes.
- Clock skew: the expiry check uses the database time (`now()` in the query), not the server clock.

## Tests

- create → verify → revoke → verify fails; an expired token fails; the plaintext is never persisted.
- A token on a mutating route → 403; on a whitelisted read route → 200 for a member, 404 for a non-member.
- The token limit.

## Check when done

- [ ] Tokens can be created (shown once), listed, and revoked in settings.
- [ ] `curl -H "Authorization: Bearer omg_…" /api/projects` returns the user's projects.
- [ ] No mutating route accepts a token.
- [ ] Definition of done in `context/feature-specs/README.md`.

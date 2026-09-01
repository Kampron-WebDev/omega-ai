# Progress Tracker

Update this file whenever the current phase, active feature, or implementation state changes.

## Current Phase

- Auth

## Current Goal

- Define the next feature spec to implement.

## Completed

- Design system (shadcn/ui, lucide-react, `cn()` helper) — see `context/feature-specs/01-design-system.md`. Installed Button, Card, Dialog, Input, Tabs, Textarea, ScrollArea; verified via `tsc --noEmit` and `next build`; forced dark theme via `dark` class on `<html>` since the app has no light/dark toggle.
- Editor chrome — see `context/feature-specs/02-editor-chrome.md`. Added `components/editor/editor-navbar.tsx` (fixed-height top navbar, left/center/right sections, sidebar toggle button with `PanelLeftOpen`/`PanelLeftClose`) and `components/editor/project-sidebar.tsx` (fixed overlay below the navbar, slides in/out via translate-x, `isOpen`/`onClose` props, shadcn `Tabs` with My Projects/Shared empty states, full-width `New Project` button with `Plus` icon). Wired both into `app/page.tsx` with `useState` sidebar toggle so they're actually reachable. The dialog title/description/footer pattern from the spec is already satisfied by the existing `components/ui/dialog.tsx` from the design-system phase (uses `--popover`/`--muted` tokens) — no new dialog file was needed and no concrete dialogs were built, per spec. Verified via `tsc --noEmit`, `eslint`, `next build`, and a curl smoke test of the dev server's rendered HTML for the expected navbar/sidebar text.
- Auth — see `context/feature-specs/03-auth.md`. Installed `@clerk/ui`. `app/layout.tsx` wraps `<body>`'s children in `ClerkProvider` with `appearance` from the new `lib/clerk-appearance.ts` (Clerk's `dark` theme from `@clerk/ui/themes` as the base, `variables` overridden with `var(--primary)`, `var(--card)`, `var(--muted)`, `var(--input)`, `var(--border)`, `var(--ring)`, `var(--destructive)`, `var(--radius-2xl)`, `var(--font-geist-sans)` etc. — the app's real shadcn/Tailwind tokens from `globals.css`, no hardcoded colors). Added `components/auth/auth-layout.tsx`, a two-panel layout (left: logo/tagline/text-only feature list, hidden below `lg`; right: centered form) used by the new `app/sign-in/[[...sign-in]]/page.tsx` and `app/sign-up/[[...sign-up]]/page.tsx` (`<SignIn />`/`<SignUp />`). Added `proxy.ts` at the root (Next.js 16 renamed `middleware.ts` → `proxy.ts`) with `clerkMiddleware` + `createRouteMatcher`, protecting everything except `/`, `/sign-in(.*)`, `/sign-up(.*)`. Moved the editor-chrome page body from `app/page.tsx` to `app/editor/page.tsx`; `app/page.tsx` is now an async Server Component that calls `auth()` and redirects to `/editor` (authenticated) or `/sign-in` (unauthenticated). Added `<UserButton />` to `EditorNavbar`'s right section. Verified via `tsc --noEmit`, `eslint`, `next build` (route table confirms `proxy.ts` is picked up as the Proxy/Middleware layer), and curl smoke tests against the dev server: `GET /` → 307 to `/sign-in`, `GET /editor` (unauthenticated) → 307 to `/sign-in?redirect_url=...`, `GET /sign-in` → 200 with the auth layout's copy in the HTML and the appearance payload showing our `var(--...)` overrides layered on the `dark` theme.

## In Progress

- None.

## Next Up

- Add the next planned feature unit here.

## Open Questions

- `context/ui-context.md` documents a token set (`--bg-base`, `--text-primary`, `--accent-primary`, Tailwind names like `bg-base`/`text-copy-primary`, etc.) that does not exist anywhere in `app/globals.css` or the codebase — the app actually ships the default shadcn/Tailwind v4 tokens (`--background`, `--foreground`, `--card`, `--popover`, `--muted`, `--accent`, `--border`, `--input`, `--ring`, `--destructive`, oklch values). The auth feature was built against the real tokens (per `code-standards.md`: "tokens defined in `globals.css`"). `ui-context.md` should be reconciled with the actual design system (either the doc is updated to match shadcn's tokens, or the aspirational token set gets implemented) before the next UI-heavy feature.
- `context/feature-specs/03-auth.md` says to define public routes "using the existing sign-in and sign-up env vars," but `.env.local` had no such vars. Added `NEXT_PUBLIC_CLERK_SIGN_IN_URL=/sign-in` and `NEXT_PUBLIC_CLERK_SIGN_UP_URL=/sign-up` (Clerk's own standard var names, not invented ones) rather than blocking on this — flagging here in case that wasn't the intended resolution.

## Architecture Decisions

- `ProjectSidebar` is `position: fixed`, anchored `top-12` (matching the navbar's `h-12`) so it overlays the canvas below the navbar without pushing layout, per the "should not push page content" requirement.
- Auth route protection uses a protected-first `proxy.ts` strategy (block everything, allow-list `/`, `/sign-in(.*)`, `/sign-up(.*)`) rather than public-first, matching `architecture-context.md`'s "Only authenticated users can access protected routes" invariant and the spec's "Protect everything else by default."
- `/` owns its own redirect logic at the page level (Server Component + `auth()`) rather than relying on the proxy's default `auth.protect()` redirect, since the spec calls out `/`'s authenticated/unauthenticated behavior as a distinct requirement; `/` is in the proxy's public allow-list so this logic isn't shadowed.

## Session Notes

- No headless browser tooling (playwright/puppeteer/chromium) is installed in this container, so the editor chrome was verified via `tsc`, `eslint`, `next build`, and a curl-based HTML smoke test rather than a rendered screenshot. If visual verification is needed later, install a Chromium-based driver first. Same constraint applied to the auth feature — sign-in/sign-up visuals and the authenticated `UserButton` state were not visually verified in a browser.

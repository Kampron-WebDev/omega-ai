# Code Standards

## General

- Keep modules small and single-purpose.
- Fix root causes — do not layer workarounds.
- Do not mix unrelated concerns in one component or route.
- Respect the system boundaries defined in `architecture-context.md`.
- Keep decision logic in pure functions in `lib/` so it can be tested without React, Liveblocks, or the network. Components and task bodies orchestrate; they do not decide.

## TypeScript

- Strict mode is required throughout the project.
- Avoid `any`; use explicit interfaces or narrowly scoped types.
- Validate unknown external input at system boundaries before trusting it.
- Use `interface` for object contracts. Use `type` where a library requires a plain object type (see the Liveblocks `Presence` decision in `progress-tracker.md`).

## Validation

- New validation uses zod (declared in spec 21). The hand-rolled parsers in `lib/project-input.ts` stay until they need to change.
- Environment variables are read only through `getServerEnv()` in `lib/env.ts`, never from `process.env` directly (except `NEXT_PUBLIC_*` in client code).
- Every graph that crosses a boundary goes through `lib/canvas-schema.ts`.
- Every realtime feed message is validated with the schemas in `types/tasks.ts` before it is rendered.
- Every model output is validated with zod before it is used.

## Next.js

- Default to React Server Components.
- Add `"use client"` only when the component needs browser interactivity, hooks, or real-time state.
- Keep route handlers focused on a single responsibility.
- Long-running work belongs in background tasks, not in request handlers.
- Read the relevant guide in `node_modules/next/dist/docs/` before using a Next.js API; this version differs from older releases.

## Styling

- Use the CSS custom property tokens defined in `globals.css` — no raw Tailwind color classes like `zinc-*` and no hardcoded hex values in components.
- Reference tokens through their real Tailwind utility names, as mapped in `@theme inline`:

  | Purpose | Utility |
  | --- | --- |
  | Backgrounds | `bg-bg-base`, `bg-bg-surface`, `bg-bg-elevated`, `bg-bg-subtle` (shadcn aliases `bg-background`, `bg-card`, `bg-muted` also work) |
  | Borders | `border-border-default`, `border-border-subtle` |
  | Text | `text-copy-primary`, `text-copy-secondary`, `text-copy-muted`, `text-copy-faint` |
  | Brand accent | `text-brand`, `bg-brand`, `bg-accent-dim` |
  | AI accent | `bg-ai`, `text-ai-text` |
  | Errors | `text-destructive`, `bg-destructive` |

  Note: `bg-accent` is shadcn's slot and resolves to the 12% cyan dim, not a solid accent. Spec texts that use other names (`bg-base`, `border-surface-border`, `text-primary-text`) mean the utilities above.
- If a needed token has no utility (for example `--state-warning`), add a `--color-*` mapping to `@theme inline` rather than using the variable inline.
- Raw hex values are allowed only as data sent over the wire or persisted (node palette, cursor colors, the AI agent's color), with a comment saying so.
- Maintain the border radius scale: `rounded-xl` for small elements, `rounded-2xl` for cards and panels, `rounded-3xl` for modals.

## API Routes

- Order: authenticate → parse input → resolve access → act → respond.
- Validate and parse request input before any logic runs.
- Enforce auth and project access checks on every read and mutation.
- Return errors only through `lib/api-response.ts` codes, so the same failure always has the same status and body shape.
- Resolve the project from the room ID or route parameter through an access check; never trust a client-supplied project ID or graph.
- Keep route handlers thin — push complexity into shared modules or background tasks.

## AI and Background Tasks

- LLM calls happen only in `trigger/` tasks. Routes start runs through `lib/trigger-runs.ts`.
- Name the model provider only in `lib/ai/model.ts`.
- Keep prompt builders pure (`lib/ai/prompts/`), and fence every piece of user-authored content with `wrapUntrusted`.
- A task must always leave the room clean: a terminal status published, presence cleared, and the `TaskRun` in a terminal state, on success, failure, or cancellation.
- Never log prompts, chat content, brief text, or model output. Log IDs, sizes, durations, and token counts.

## Data and Storage

- Project metadata and relationships belong in PostgreSQL via Prisma.
- Canvas snapshots, checkpoints, specs, reviews, and build plans belong in Vercel Blob; Prisma stores only the reference and metadata.
- Do not store large generated content directly in the database.
- New models that belong to a project declare the relation with `onDelete: Cascade`, and an index for their main list query.
- Task run records are first-class relational data — treat ownership and run IDs as verified before any token issuance.

## Testing

- Every pure module in `lib/` gets unit tests next to it (`lib/foo.test.ts`).
- Every new route handler gets tests for 401, 400, access denial, and success, with Prisma, Clerk, Liveblocks, Blob, and Trigger.dev mocked.
- Hooks with real logic get jsdom tests (`// @vitest-environment jsdom`).
- Tests never touch a real database, network, or model.
- UI that was not observed in a browser is recorded as unobserved in `progress-tracker.md`.

## File Organization

- `lib/` — shared infrastructure and pure logic: Prisma client, auth and access helpers, env, canvas schema and layout, room access, artifacts, AI prompts.
- `types/` — shared contracts and zod schemas used across client, routes, and tasks.
- `trigger/` — all durable background tasks and AI workflows.
- `hooks/` — client hooks, named `use-*.ts`.
- `components/` — UI composition only; no business logic.
- `app/api/` — route handlers for auth, triggering, and persistence.
- Name files after the responsibility they contain, not the technology.

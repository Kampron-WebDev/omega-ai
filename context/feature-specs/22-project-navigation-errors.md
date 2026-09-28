# 22 — Project Navigation and Error Surfaces

**Phase:** 4 · Foundations · **Depends on:** 21 · **Unlocks:** everyday use of every later feature

## Goal

Make existing projects reachable and failures visible. Today a project can only be reached by creating it or typing its URL (sidebar rows are not links), and a failed create, rename, or delete only logs to the console while the dialog sits open. This closes the first two open questions in `progress-tracker.md`.

## Read first

- `components/editor/project-list-item.tsx`, `project-sidebar.tsx`, `editor-home.tsx`, `editor-home-shell.tsx`
- `hooks/use-project-dialogs.ts` (the `console.error` at the submit catch) and `hooks/use-project-actions.ts`
- `components/editor/share-dialog.tsx` and `hooks/use-collaborators.ts`: the error pattern already in the codebase (`actionError` rendered with `role="alert"`). Reuse that pattern; do not invent a second one.
- `lib/projects.ts` (`listProjectsForIdentity`) and `types/project.ts`

## Implementation

1. **Rows become links.**
   - The name and slug area of `ProjectListItem` becomes a `next/link` to `/editor/{project.id}`, and the link gets the row's hover and focus styles.
   - The rename and delete buttons stay **siblings** of the link, never inside it (no interactive element inside another).
   - The active row keeps `aria-current="page"` on the link. Update the comment that says the row is not a link.
   - On small screens, following a link closes the sidebar (`onClose` is called on navigation).

2. **Recent projects on the editor home.**
   - Add `updatedAt` (ISO string) to the `Project` type, and return it from `listProjectsForIdentity()`.
   - `/editor` shows a "Recent projects" grid under the existing call to action: owned and shared merged, sorted by `updatedAt` descending, at most 12.
   - Each card shows the name, the role (Owner / Shared), and relative time ("Edited 3h ago"), and links to the workspace.
   - When there are no projects, the page is unchanged.

3. **Dialog errors.**
   - `useProjectDialogs` gains `error: string | null` and `isSubmitting: boolean` on its controller.
   - A submit failure sets `error` from the thrown `Error` message (`lib/api-client.ts` already carries the route's own message). `console.error` is removed.
   - The error clears when the input changes, when the dialog closes, and when a new submit starts.
   - Create, rename, and delete dialogs render the error under the form with `role="alert"`, linked to the field with `aria-describedby`, in `text-destructive`.
   - The submit button shows a spinner and is disabled while `isSubmitting`. Closing the dialog during a submit is allowed; a late result must not reopen it.

4. **Workspace loading and missing states.**
   - Add `app/editor/[roomId]/loading.tsx`: navbar-height bar plus a canvas skeleton using `bg-bg-surface`. No spinner-only page.
   - Keep `AccessDenied` for missing or forbidden projects. Give it a "Back to projects" link to `/editor`.

## Contracts

```ts
// types/project.ts
interface Project {
  id: string
  name: string
  slug: string
  role: "owner" | "collaborator"
  updatedAt: string // ISO 8601
}

// hooks/use-project-dialogs.ts: additions to the controller
error: string | null
isSubmitting: boolean
```

## Scope limits

- No toast system. Every failure in this unit belongs to a dialog.
- No project search, sorting controls, or pagination. The sidebar lists stay as they are.
- Do not change any route handler's status codes.

## Edge cases

- Deleting the project currently open still redirects to `/editor` (existing behavior). The redirect must not show a flash of the error state.
- A rename that fails with `403` (the user was demoted between loading and submitting) shows the route's message and leaves the name unchanged.
- Double-clicking submit sends one request.

## Tests

- `useProjectDialogs` (jsdom): error set on failure, cleared on input change and on close; `isSubmitting` toggles; a double submit sends a single request.
- `listProjectsForIdentity` returns `updatedAt` (mock Prisma).

## Check when done

- [ ] Clicking a sidebar row opens that project; the active row is marked.
- [ ] `/editor` lists recent projects as links.
- [ ] Create, rename, and delete failures show inline and never only in the console.
- [ ] `loading.tsx` renders while the workspace loads.
- [ ] The two resolved open questions are removed from `progress-tracker.md`.
- [ ] Definition of done in `context/feature-specs/README.md`.

/**
 * A user's role on a project. Mirrors the owner/collaborator model described in
 * `context/architecture-context.md`: every project has exactly one owner and may
 * have additional collaborators.
 */
type ProjectRole = "owner" | "collaborator"

interface Project {
  id: string
  name: string
  slug: string
  role: ProjectRole
}

/** Which project dialog is currently open. */
type ProjectDialogKind = "create" | "rename" | "delete"

/**
 * A confirmed project mutation, emitted by `useProjectDialogs` when a dialog is
 * submitted. This is the seam the persistence layer plugs into later: today the
 * editor applies it to in-memory mock data, tomorrow it calls `app/api`.
 */
type ProjectDialogIntent =
  | { kind: "create"; name: string; slug: string }
  | { kind: "rename"; project: Project; name: string; slug: string }
  | { kind: "delete"; project: Project }

export type { Project, ProjectDialogIntent, ProjectDialogKind, ProjectRole }

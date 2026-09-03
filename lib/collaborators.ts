import { findClerkProfilesByEmail } from "@/lib/clerk-users"
import { normalizeEmail } from "@/lib/email"
import { prisma } from "@/lib/prisma"
import type { Collaborator } from "@/types/collaborator"

/**
 * The collaborator data helper. Mirrors `lib/projects.ts`: the route handlers
 * decide who is allowed in, these functions do the reading and writing, and the
 * Clerk enrichment is folded in here so every caller gets the same shape.
 *
 * None of these functions check ownership — that is the caller's job, done with
 * `findOwnedProject`, so the 404-vs-403 distinction stays in one place.
 */

const COLLABORATOR_FIELDS = { id: true, email: true } as const

interface CollaboratorRow {
  id: string
  email: string
}

type AddCollaboratorResult =
  | { status: "ok"; collaborator: Collaborator }
  | { status: "duplicate" }

/**
 * Attaches the Clerk name and avatar to stored rows in a single lookup, rather
 * than one Backend API call per collaborator.
 */
async function withClerkProfiles(rows: CollaboratorRow[]): Promise<Collaborator[]> {
  if (rows.length === 0) {
    return []
  }

  const profiles = await findClerkProfilesByEmail(rows.map((row) => row.email))

  return rows.map((row) => {
    const profile = profiles.get(normalizeEmail(row.email))

    return {
      id: row.id,
      email: row.email,
      name: profile?.name ?? null,
      imageUrl: profile?.imageUrl ?? null,
    }
  })
}

/** Everyone invited to a project, in the order they were invited. */
async function listProjectCollaborators(projectId: string): Promise<Collaborator[]> {
  const rows = await prisma.projectCollaborator.findMany({
    where: { projectId },
    orderBy: { createdAt: "asc" },
    select: COLLABORATOR_FIELDS,
  })

  return withClerkProfiles(rows)
}

/**
 * Invites an email to a project.
 *
 * The email is normalized on the way in so it matches the sessions that will
 * later be checked against it. Re-inviting an existing collaborator is reported
 * as `duplicate` rather than silently succeeding, so the dialog can say so —
 * decided by the `@@unique([projectId, email])` constraint instead of a
 * read-then-write, which two simultaneous invites could both pass.
 */
async function addProjectCollaborator({
  projectId,
  email,
}: {
  projectId: string
  email: string
}): Promise<AddCollaboratorResult> {
  try {
    const row = await prisma.projectCollaborator.create({
      data: { projectId, email: normalizeEmail(email) },
      select: COLLABORATOR_FIELDS,
    })

    const [collaborator] = await withClerkProfiles([row])

    return { status: "ok", collaborator }
  } catch (error) {
    if (isUniqueConstraintError(error)) {
      return { status: "duplicate" }
    }

    throw error
  }
}

/**
 * Removes a collaborator from a project.
 *
 * Scoped by `projectId` as well as by ID: without it, an owner of any project
 * could delete a collaborator row belonging to someone else's project by
 * guessing its ID. Returns whether a row was actually removed.
 */
async function removeProjectCollaborator({
  projectId,
  collaboratorId,
}: {
  projectId: string
  collaboratorId: string
}): Promise<boolean> {
  const { count } = await prisma.projectCollaborator.deleteMany({
    where: { id: collaboratorId, projectId },
  })

  return count > 0
}

/**
 * Prisma's unique-constraint violation, matched on the error code so the
 * generated client's error class does not have to be imported here.
 */
function isUniqueConstraintError(error: unknown): boolean {
  return (
    typeof error === "object" &&
    error !== null &&
    "code" in error &&
    (error as { code?: unknown }).code === "P2002"
  )
}

export type { AddCollaboratorResult }
export { addProjectCollaborator, listProjectCollaborators, removeProjectCollaborator }

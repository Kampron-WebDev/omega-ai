import { normalizeEmail } from "@/lib/email"
import { prisma } from "@/lib/prisma"
import { slugify } from "@/lib/slug"
import type { Project, ProjectIdentity, ProjectRole } from "@/types/project"

/**
 * The project data helper: every read and every owner-checked mutation of a
 * project goes through here, so route handlers stay thin and the server
 * components in `07-wire-editor-home.md` can call the same functions without a
 * round trip through `fetch`.
 */

/** Only what `types/project.ts`'s `Project` needs; `slug` is derived, not stored. */
const PROJECT_FIELDS = { id: true, name: true } as const

interface ProjectRow {
  id: string
  name: string
}

interface ProjectLists {
  owned: Project[]
  shared: Project[]
}

type OwnedProjectResult =
  | { status: "ok"; project: Project }
  | { status: "not_found" }
  | { status: "forbidden" }

/**
 * The slug is a display label derived from the current name, never an
 * identifier: the project's cuid is the ID and the Liveblocks room ID, so a
 * rename changes the slug freely without moving any state.
 */
function toProject(row: ProjectRow, role: ProjectRole): Project {
  return { id: row.id, name: row.name, slug: slugify(row.name), role }
}

/**
 * Both lists the sidebar renders: projects the user owns, and projects they were
 * invited to by email. Newest first.
 */
async function listProjectsForIdentity(identity: ProjectIdentity): Promise<ProjectLists> {
  const [owned, shared] = await Promise.all([
    prisma.project.findMany({
      where: { ownerId: identity.userId },
      orderBy: { createdAt: "desc" },
      select: PROJECT_FIELDS,
    }),
    identity.email
      ? prisma.project.findMany({
          // Normalized again here so a caller that skipped `getCurrentIdentity()`
          // still matches stored rows. An owner who invited their own email
          // stays in `owned` only.
          where: {
            ownerId: { not: identity.userId },
            collaborators: { some: { email: normalizeEmail(identity.email) } },
          },
          orderBy: { createdAt: "desc" },
          select: PROJECT_FIELDS,
        })
      : Promise.resolve([]),
  ])

  return {
    owned: owned.map((project) => toProject(project, "owner")),
    shared: shared.map((project) => toProject(project, "collaborator")),
  }
}

/**
 * The membership check behind `/editor/[roomId]`: resolves the project only if
 * the caller owns it or was invited to it, and reports which. Returns `null`
 * for both "no such project" and "not yours", so a caller cannot use it to
 * probe which project IDs exist.
 */
async function findProjectForIdentity(
  projectId: string,
  identity: ProjectIdentity,
): Promise<Project | null> {
  const collaboratorMatch = identity.email
    ? [{ collaborators: { some: { email: normalizeEmail(identity.email) } } }]
    : []

  const project = await prisma.project.findFirst({
    where: {
      id: projectId,
      OR: [{ ownerId: identity.userId }, ...collaboratorMatch],
    },
    select: { ...PROJECT_FIELDS, ownerId: true },
  })

  if (!project) {
    return null
  }

  return toProject(project, project.ownerId === identity.userId ? "owner" : "collaborator")
}

/** The ID comes from the schema's `cuid()` default — no sequential IDs. */
async function createProject({
  ownerId,
  name,
}: {
  ownerId: string
  name: string
}): Promise<Project> {
  const project = await prisma.project.create({
    data: { ownerId, name },
    select: PROJECT_FIELDS,
  })

  return toProject(project, "owner")
}

/**
 * Resolves a project the caller owns, distinguishing "no such project" from
 * "not yours" so the handler can answer 404 or 403.
 */
async function findOwnedProject(
  projectId: string,
  ownerId: string,
): Promise<OwnedProjectResult> {
  const project = await prisma.project.findUnique({
    where: { id: projectId },
    select: { ...PROJECT_FIELDS, ownerId: true },
  })

  if (!project) {
    return { status: "not_found" }
  }

  if (project.ownerId !== ownerId) {
    return { status: "forbidden" }
  }

  return { status: "ok", project: toProject(project, "owner") }
}

async function renameOwnedProject({
  projectId,
  ownerId,
  name,
}: {
  projectId: string
  ownerId: string
  name: string
}): Promise<OwnedProjectResult> {
  const existing = await findOwnedProject(projectId, ownerId)

  if (existing.status !== "ok") {
    return existing
  }

  const project = await prisma.project.update({
    where: { id: projectId },
    data: { name },
    select: PROJECT_FIELDS,
  })

  return { status: "ok", project: toProject(project, "owner") }
}

/**
 * Hard delete. `ProjectCollaborator` rows cascade with the project; artifacts
 * held outside Postgres do not, and are the later specs' problem to clean up.
 */
async function deleteOwnedProject({
  projectId,
  ownerId,
}: {
  projectId: string
  ownerId: string
}): Promise<OwnedProjectResult> {
  const existing = await findOwnedProject(projectId, ownerId)

  if (existing.status !== "ok") {
    return existing
  }

  await prisma.project.delete({ where: { id: projectId } })

  return existing
}

export type { OwnedProjectResult, ProjectLists }
export {
  createProject,
  deleteOwnedProject,
  findOwnedProject,
  findProjectForIdentity,
  listProjectsForIdentity,
  renameOwnedProject,
}

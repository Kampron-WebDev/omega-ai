import { forbidden, notFound, unauthorized } from "@/lib/api-response"
import { removeProjectCollaborator } from "@/lib/collaborators"
import { getCurrentUserId } from "@/lib/project-access"
import { findOwnedProject } from "@/lib/projects"

/**
 * `DELETE /api/projects/[projectId]/collaborators/[collaboratorId]` — revoke a
 * collaborator's access.
 *
 * Owner-only. Ownership is checked against the project in the URL before the
 * row is touched, and the delete is scoped to that project, so a collaborator
 * ID from another project cannot be removed through it.
 */
export async function DELETE(
  _request: Request,
  context: RouteContext<"/api/projects/[projectId]/collaborators/[collaboratorId]">,
): Promise<Response> {
  // Ownership alone decides this, so the session token is enough — no
  // `currentUser()` round trip to Clerk.
  const ownerId = await getCurrentUserId()

  if (!ownerId) {
    return unauthorized()
  }

  const { projectId, collaboratorId } = await context.params
  const owned = await findOwnedProject(projectId, ownerId)

  // Same split as the rename and delete handlers: 403 for a real project owned
  // by someone else, 404 for everything else.
  if (owned.status === "forbidden") {
    return forbidden()
  }

  if (owned.status === "not_found") {
    return notFound()
  }

  const removed = await removeProjectCollaborator({ projectId, collaboratorId })

  if (!removed) {
    return notFound("Collaborator not found.")
  }

  return Response.json({ id: collaboratorId })
}

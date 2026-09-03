import {
  conflict,
  forbidden,
  invalidRequest,
  notFound,
  unauthorized,
} from "@/lib/api-response"
import { addProjectCollaborator, listProjectCollaborators } from "@/lib/collaborators"
import { getCurrentIdentity, getProjectAccess } from "@/lib/project-access"
import { parseCollaboratorEmail, readJsonObject } from "@/lib/project-input"
import { findOwnedProject } from "@/lib/projects"

/**
 * `GET /api/projects/[projectId]/collaborators` — everyone invited to the
 * project.
 *
 * Readable by collaborators as well as the owner: the share dialog shows them
 * the list read-only. Access is resolved with the same membership check the
 * workspace route uses, so a stranger gets a 404 either way.
 */
export async function GET(
  _request: Request,
  context: RouteContext<"/api/projects/[projectId]/collaborators">,
): Promise<Response> {
  const identity = await getCurrentIdentity()

  if (!identity) {
    return unauthorized()
  }

  const { projectId } = await context.params
  const project = await getProjectAccess(projectId, identity)

  if (!project) {
    return notFound()
  }

  const collaborators = await listProjectCollaborators(projectId)

  return Response.json({ collaborators })
}

/**
 * `POST /api/projects/[projectId]/collaborators` — invite an email.
 *
 * Owner-only, checked here rather than trusted from the client: the dialog
 * hides the form from collaborators, but hiding a form is not access control.
 */
export async function POST(
  request: Request,
  context: RouteContext<"/api/projects/[projectId]/collaborators">,
): Promise<Response> {
  // The identity, not just the user ID: the owner's own address is needed to
  // reject a self-invite, and the caller here is always the owner.
  const identity = await getCurrentIdentity()

  if (!identity) {
    return unauthorized()
  }

  const body = await readJsonObject(request)

  if (!body.ok) {
    return invalidRequest(body.message)
  }

  const email = parseCollaboratorEmail(body.value.email)

  if (!email.ok) {
    return invalidRequest(email.message)
  }

  const { projectId } = await context.params
  const owned = await findOwnedProject(projectId, identity.userId)

  // Same split as the rename and delete handlers: 403 for a real project owned
  // by someone else, 404 for everything else.
  if (owned.status === "forbidden") {
    return forbidden()
  }

  if (owned.status === "not_found") {
    return notFound()
  }

  if (identity.email && identity.email === email.value) {
    return conflict("You already own this project.")
  }

  const result = await addProjectCollaborator({ projectId, email: email.value })

  if (result.status === "duplicate") {
    return conflict("That person is already a collaborator.")
  }

  return Response.json({ collaborator: result.collaborator }, { status: 201 })
}

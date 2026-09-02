import { forbidden, invalidRequest, notFound, unauthorized } from "@/lib/api-response"
import { getCurrentUserId } from "@/lib/project-access"
import { parseProjectName, readJsonObject } from "@/lib/project-input"
import type { OwnedProjectResult } from "@/lib/projects"
import { deleteOwnedProject, renameOwnedProject } from "@/lib/projects"

interface RouteContext {
  params: Promise<{ projectId: string }>
}

/**
 * Both mutations answer the same three ways, and the failures must not leak
 * whether a project exists to someone who cannot see it — hence 403 only for a
 * real project owned by someone else, 404 for everything else.
 */
function respond(result: OwnedProjectResult): Response {
  switch (result.status) {
    case "ok":
      return Response.json({ project: result.project })
    case "forbidden":
      return forbidden()
    case "not_found":
      return notFound()
  }
}

/** `PATCH /api/projects/[projectId]` — rename a project the caller owns. */
export async function PATCH(request: Request, context: RouteContext): Promise<Response> {
  const ownerId = await getCurrentUserId()

  if (!ownerId) {
    return unauthorized()
  }

  const body = await readJsonObject(request)

  if (!body.ok) {
    return invalidRequest(body.message)
  }

  const name = parseProjectName(body.value.name)

  if (!name.ok) {
    return invalidRequest(name.message)
  }

  const { projectId } = await context.params

  return respond(await renameOwnedProject({ projectId, ownerId, name: name.value }))
}

/** `DELETE /api/projects/[projectId]` — delete a project the caller owns. */
export async function DELETE(_request: Request, context: RouteContext): Promise<Response> {
  const ownerId = await getCurrentUserId()

  if (!ownerId) {
    return unauthorized()
  }

  const { projectId } = await context.params

  return respond(await deleteOwnedProject({ projectId, ownerId }))
}

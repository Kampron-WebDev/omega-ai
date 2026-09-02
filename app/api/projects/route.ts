import { invalidRequest, unauthorized } from "@/lib/api-response"
import { getCurrentIdentity, getCurrentUserId } from "@/lib/project-access"
import {
  DEFAULT_PROJECT_NAME,
  parseProjectName,
  readJsonObject,
} from "@/lib/project-input"
import { createProject, listProjectsForIdentity } from "@/lib/projects"

/** `GET /api/projects` — the caller's projects, split into owned and shared. */
export async function GET(): Promise<Response> {
  const identity = await getCurrentIdentity()

  if (!identity) {
    return unauthorized()
  }

  const projects = await listProjectsForIdentity(identity)

  return Response.json(projects)
}

/** `POST /api/projects` — create a project owned by the caller. */
export async function POST(request: Request): Promise<Response> {
  const ownerId = await getCurrentUserId()

  if (!ownerId) {
    return unauthorized()
  }

  const body = await readJsonObject(request)

  if (!body.ok) {
    return invalidRequest(body.message)
  }

  const name = parseProjectName(body.value.name, { fallback: DEFAULT_PROJECT_NAME })

  if (!name.ok) {
    return invalidRequest(name.message)
  }

  const project = await createProject({ ownerId, name: name.value })

  return Response.json({ project }, { status: 201 })
}

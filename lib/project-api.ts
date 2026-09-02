import type { ApiErrorBody } from "@/lib/api-response"
import type { Project } from "@/types/project"

/**
 * Browser-side client for `app/api/projects`. Mutations go through the routes
 * (they enforce ownership) while the initial read is done server-side by
 * `lib/projects.ts` — so this module only covers create, rename, and delete.
 *
 * Client only: it calls `fetch` with a relative URL.
 */

interface ProjectResponse {
  project: Project
}

function isApiErrorBody(body: unknown): body is ApiErrorBody {
  return (
    typeof body === "object" &&
    body !== null &&
    "error" in body &&
    typeof (body as ApiErrorBody).error?.message === "string"
  )
}

/**
 * Surfaces the route's own error message when there is one, so a `403` reads as
 * "Only the project owner…" rather than a bare status code.
 */
async function readErrorMessage(response: Response): Promise<string> {
  try {
    const body: unknown = await response.json()

    if (isApiErrorBody(body)) {
      return body.error.message
    }
  } catch {
    // Fall through to the status-based message.
  }

  return `Request failed with status ${response.status}.`
}

async function requestProject(url: string, init: RequestInit): Promise<Project> {
  const response = await fetch(url, {
    ...init,
    headers: { "Content-Type": "application/json", ...init.headers },
  })

  if (!response.ok) {
    throw new Error(await readErrorMessage(response))
  }

  const body: ProjectResponse = await response.json()

  return body.project
}

function createProjectRequest(name: string): Promise<Project> {
  return requestProject("/api/projects", {
    method: "POST",
    body: JSON.stringify({ name }),
  })
}

function renameProjectRequest(projectId: string, name: string): Promise<Project> {
  return requestProject(`/api/projects/${encodeURIComponent(projectId)}`, {
    method: "PATCH",
    body: JSON.stringify({ name }),
  })
}

function deleteProjectRequest(projectId: string): Promise<Project> {
  return requestProject(`/api/projects/${encodeURIComponent(projectId)}`, {
    method: "DELETE",
  })
}

export { createProjectRequest, deleteProjectRequest, renameProjectRequest }

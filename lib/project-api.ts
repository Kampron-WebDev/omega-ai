import { requestJson } from "@/lib/api-client"
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

async function requestProject(url: string, init: RequestInit): Promise<Project> {
  const { project } = await requestJson<ProjectResponse>(url, init)

  return project
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

import { requestJson } from "@/lib/api-client"
import type { Collaborator } from "@/types/collaborator"

/**
 * Browser-side client for `app/api/projects/[projectId]/collaborators`.
 *
 * The list is fetched rather than server-rendered because it is only needed
 * once the share dialog opens, and it changes while the dialog is open.
 *
 * Client only: it calls `fetch` with a relative URL.
 */

interface CollaboratorListResponse {
  collaborators: Collaborator[]
}

interface CollaboratorResponse {
  collaborator: Collaborator
}

function collaboratorsUrl(projectId: string): string {
  return `/api/projects/${encodeURIComponent(projectId)}/collaborators`
}

/** `signal` lets a dialog that closes mid-flight abandon the request. */
async function listCollaboratorsRequest(
  projectId: string,
  signal?: AbortSignal,
): Promise<Collaborator[]> {
  const { collaborators } = await requestJson<CollaboratorListResponse>(
    collaboratorsUrl(projectId),
    { signal },
  )

  return collaborators
}

async function inviteCollaboratorRequest(
  projectId: string,
  email: string,
): Promise<Collaborator> {
  const { collaborator } = await requestJson<CollaboratorResponse>(
    collaboratorsUrl(projectId),
    { method: "POST", body: JSON.stringify({ email }) },
  )

  return collaborator
}

async function removeCollaboratorRequest(
  projectId: string,
  collaboratorId: string,
): Promise<void> {
  await requestJson<{ id: string }>(
    `${collaboratorsUrl(projectId)}/${encodeURIComponent(collaboratorId)}`,
    { method: "DELETE" },
  )
}

export {
  inviteCollaboratorRequest,
  listCollaboratorsRequest,
  removeCollaboratorRequest,
}

import { redirect } from "next/navigation"

import { AccessDenied } from "@/components/editor/access-denied"
import { EditorWorkspaceShell } from "@/components/editor/editor-workspace-shell"
import { getCurrentIdentity, getProjectAccess } from "@/lib/project-access"
import { listProjectsForIdentity } from "@/lib/projects"

/**
 * Server Component: the access check runs before anything renders, so an
 * unauthorized viewer never receives the project's name, let alone its canvas.
 * The room ID is the project's cuid.
 */
export default async function WorkspacePage(props: PageProps<"/editor/[roomId]">) {
  const identity = await getCurrentIdentity()

  if (!identity) {
    redirect("/sign-in")
  }

  const { roomId } = await props.params
  const project = await getProjectAccess(roomId, identity)

  if (!project) {
    return <AccessDenied />
  }

  const { owned, shared } = await listProjectsForIdentity(identity)

  return (
    <EditorWorkspaceShell
      project={project}
      ownedProjects={owned}
      sharedProjects={shared}
    />
  )
}

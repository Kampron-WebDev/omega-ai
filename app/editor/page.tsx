import { redirect } from "next/navigation"

import { EditorHomeShell } from "@/components/editor/editor-home-shell"
import { getCurrentIdentity } from "@/lib/project-access"
import { listProjectsForIdentity } from "@/lib/projects"

/**
 * Server Component: both project lists are read here, through the same data
 * helper `app/api/projects` uses, and handed to the client shell as props. The
 * initial load makes no client-side request.
 */
export default async function EditorPage() {
  const identity = await getCurrentIdentity()

  if (!identity) {
    redirect("/sign-in")
  }

  const { owned, shared } = await listProjectsForIdentity(identity)

  return <EditorHomeShell ownedProjects={owned} sharedProjects={shared} />
}

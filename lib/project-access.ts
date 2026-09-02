import { auth, currentUser } from "@clerk/nextjs/server"

import { normalizeEmail } from "@/lib/email"
import { findProjectForIdentity } from "@/lib/projects"
import type { Project, ProjectIdentity } from "@/types/project"

/** The signed-in Clerk user ID, or `null` when the request is anonymous. */
async function getCurrentUserId(): Promise<string | null> {
  const { userId } = await auth()

  return userId ?? null
}

/**
 * Adds the primary email to the session's user ID — the two terms a project is
 * addressed by. `currentUser()` is a Clerk Backend API call, so this is only for
 * the paths that resolve collaborator access; mutations that only need ownership
 * use `getCurrentUserId()` and stay on the session token.
 */
async function getCurrentIdentity(): Promise<ProjectIdentity | null> {
  const userId = await getCurrentUserId()

  if (!userId) {
    return null
  }

  const user = await currentUser()
  const email = user?.primaryEmailAddress?.emailAddress

  return { userId, email: email ? normalizeEmail(email) : null }
}

/**
 * Whether the identity may open a project, and as what.
 *
 * `null` covers both "no such project" and "you were not invited": the
 * workspace shows the same `AccessDenied` for either, so the two are
 * deliberately indistinguishable here.
 */
async function getProjectAccess(
  projectId: string,
  identity: ProjectIdentity,
): Promise<Project | null> {
  return findProjectForIdentity(projectId, identity)
}

export { getCurrentIdentity, getCurrentUserId, getProjectAccess }

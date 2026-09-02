import { auth, currentUser } from "@clerk/nextjs/server"

/**
 * Who is making the request, in the two terms the project model is addressed by:
 * the Clerk user ID (owners) and the primary email (collaborators, per
 * `09-share-dialog.md`'s "no local user table" rule).
 */
interface ProjectIdentity {
  userId: string
  email: string | null
}

/**
 * Collaborator emails are compared as-is by Postgres, so every write and every
 * lookup has to agree on one casing. Lowercase is that casing — invites in the
 * share dialog must normalize through here too, or an invite to
 * `Bob@Example.com` will not match a session whose primary email is
 * `bob@example.com`.
 */
function normalizeEmail(email: string): string {
  return email.trim().toLowerCase()
}

/** The signed-in Clerk user ID, or `null` when the request is anonymous. */
async function getCurrentUserId(): Promise<string | null> {
  const { userId } = await auth()

  return userId ?? null
}

/**
 * Adds the primary email to the session's user ID. `currentUser()` is a Clerk
 * Backend API call, so this is only for the paths that actually resolve
 * collaborator access — mutations that only need ownership use
 * `getCurrentUserId()` and stay on the session token.
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

export type { ProjectIdentity }
export { getCurrentIdentity, getCurrentUserId, normalizeEmail }

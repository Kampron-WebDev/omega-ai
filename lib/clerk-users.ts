import { clerkClient } from "@clerk/nextjs/server"

import { normalizeEmail } from "@/lib/email"

/**
 * Reads Clerk profiles for collaborator emails.
 *
 * Collaborators are stored by email and there is no local user table, so a
 * display name and an avatar only exist in Clerk. This module is the one place
 * that asks for them, and it is deliberately best-effort: a missing user, or
 * Clerk being unreachable, degrades the share dialog to plain email rows rather
 * than failing the request.
 */

/** Clerk's `emailAddress` filter accepts at most 100 addresses per request. */
const MAX_EMAILS_PER_REQUEST = 100

interface ClerkProfile {
  name: string | null
  imageUrl: string | null
}

/** What Clerk gives us back, narrowed to the two fields the dialog renders. */
interface ClerkUserFields {
  fullName: string | null
  username: string | null
  imageUrl: string
  emailAddresses: { emailAddress: string }[]
}

function chunk<T>(items: T[], size: number): T[][] {
  const chunks: T[][] = []

  for (let index = 0; index < items.length; index += size) {
    chunks.push(items.slice(index, index + size))
  }

  return chunks
}

/**
 * A Clerk user with neither a name nor an avatar adds nothing to the email we
 * already have, so it is reported as no profile at all and the row falls back.
 */
function toProfile(user: ClerkUserFields): ClerkProfile | null {
  const name = (user.fullName ?? user.username ?? "").trim()
  const imageUrl = user.imageUrl.trim()

  if (name === "" && imageUrl === "") {
    return null
  }

  return { name: name === "" ? null : name, imageUrl: imageUrl === "" ? null : imageUrl }
}

/**
 * Maps normalized emails to their Clerk profile. Emails with no matching user
 * are simply absent from the map.
 */
async function findClerkProfilesByEmail(
  emails: string[],
): Promise<Map<string, ClerkProfile>> {
  const profiles = new Map<string, ClerkProfile>()
  const wanted = [...new Set(emails.map(normalizeEmail))].filter((email) => email !== "")

  if (wanted.length === 0) {
    return profiles
  }

  try {
    const client = await clerkClient()

    await Promise.all(
      chunk(wanted, MAX_EMAILS_PER_REQUEST).map(async (batch) => {
        const { data } = await client.users.getUserList({
          emailAddress: batch,
          // Clerk paginates at 10 by default, which would silently drop
          // enrichment for every collaborator past the tenth. One address
          // belongs to at most one user, so the batch size is the exact cap.
          limit: batch.length,
        })

        const requested = new Set(batch)

        for (const user of data) {
          const profile = toProfile(user)

          if (!profile) {
            continue
          }

          // Keyed off the user's own addresses rather than the request order:
          // one Clerk account can hold several of the emails we asked about,
          // and the response is not guaranteed to line up with the query.
          for (const { emailAddress } of user.emailAddresses) {
            const key = normalizeEmail(emailAddress)

            if (requested.has(key)) {
              profiles.set(key, profile)
            }
          }
        }
      }),
    )
  } catch (error) {
    // Enrichment is cosmetic. Losing it must not take the collaborator list
    // down with it, so the caller gets whatever resolved before the failure.
    console.error("Failed to load Clerk profiles for collaborators", error)
  }

  return profiles
}

export type { ClerkProfile }
export { findClerkProfilesByEmail }

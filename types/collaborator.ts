/**
 * A person invited to a project, as the share dialog renders them.
 *
 * The email is the identity: it is what the database stores and what every
 * access check compares against. `name` and `imageUrl` are enrichment fetched
 * from Clerk at read time and are `null` whenever no Clerk user owns that
 * address — `09-share-dialog.md`'s email-only fallback — so the list still
 * renders for someone who was invited before they ever signed up.
 */
interface Collaborator {
  id: string
  email: string
  name: string | null
  imageUrl: string | null
}

export type { Collaborator }

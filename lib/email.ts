/**
 * Collaborator emails are compared as-is by Postgres, so every write and every
 * lookup has to agree on one casing. Lowercase is that casing — an invite to
 * `Bob@Example.com` must not miss a session whose primary email is
 * `bob@example.com`.
 *
 * Lives on its own so both the identity layer and the data layer can normalize
 * without importing each other.
 */
function normalizeEmail(email: string): string {
  return email.trim().toLowerCase()
}

export { normalizeEmail }

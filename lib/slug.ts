const MAX_SLUG_LENGTH = 60

/**
 * Converts a project name into a URL-safe slug.
 *
 * Shared deliberately: the dialog preview and any future server-side project
 * creation must derive the same slug from the same name, so this lives in `lib/`
 * rather than inside a component.
 *
 * Returns an empty string when the name contains nothing sluggable, which
 * callers can treat as "not yet valid".
 */
function slugify(name: string): string {
  return name
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+/, "")
    .slice(0, MAX_SLUG_LENGTH)
    .replace(/-+$/, "")
}

export { MAX_SLUG_LENGTH, slugify }

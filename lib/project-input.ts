/** Applied when a create request omits a name, per `06-project-apis.md`. */
const DEFAULT_PROJECT_NAME = "Untitled Project"

/**
 * Upper bound on a stored project name. Not a product rule — a guard so an
 * unbounded string from the network never reaches the database.
 */
const MAX_PROJECT_NAME_LENGTH = 200

type ParseResult<T> = { ok: true; value: T } | { ok: false; message: string }

/**
 * Reads a request body as a JSON object. An absent or empty body parses as `{}`
 * so callers that have a fallback (create) can accept it, while callers that
 * require a field (rename) still reject it on the field check.
 */
async function readJsonObject(request: Request): Promise<ParseResult<Record<string, unknown>>> {
  const raw = await request.text()

  if (raw.trim() === "") {
    return { ok: true, value: {} }
  }

  let parsed: unknown

  try {
    parsed = JSON.parse(raw)
  } catch {
    return { ok: false, message: "Request body must be valid JSON." }
  }

  if (typeof parsed !== "object" || parsed === null || Array.isArray(parsed)) {
    return { ok: false, message: "Request body must be a JSON object." }
  }

  return { ok: true, value: parsed as Record<string, unknown> }
}

/**
 * Validates a `name` field coming off the network.
 *
 * `fallback` distinguishes the two callers: create passes
 * `DEFAULT_PROJECT_NAME` and therefore accepts a missing or blank name, rename
 * passes nothing and rejects it.
 */
function parseProjectName(
  value: unknown,
  { fallback }: { fallback?: string } = {},
): ParseResult<string> {
  if (value === undefined || value === null) {
    return fallback === undefined
      ? { ok: false, message: "`name` is required." }
      : { ok: true, value: fallback }
  }

  if (typeof value !== "string") {
    return { ok: false, message: "`name` must be a string." }
  }

  const name = value.trim()

  if (name === "") {
    return fallback === undefined
      ? { ok: false, message: "`name` must not be empty." }
      : { ok: true, value: fallback }
  }

  if (name.length > MAX_PROJECT_NAME_LENGTH) {
    return {
      ok: false,
      message: `\`name\` must be at most ${MAX_PROJECT_NAME_LENGTH} characters.`,
    }
  }

  return { ok: true, value: name }
}

export type { ParseResult }
export { DEFAULT_PROJECT_NAME, MAX_PROJECT_NAME_LENGTH, parseProjectName, readJsonObject }

import type { ApiErrorBody } from "@/lib/api-response"

/**
 * The browser's side of `app/api`: one `fetch` wrapper that every client module
 * goes through, so a failure always surfaces as an `Error` carrying the
 * handler's own message rather than a bare status code.
 *
 * Client only — it calls `fetch` with a relative URL.
 */

function isApiErrorBody(body: unknown): body is ApiErrorBody {
  return (
    typeof body === "object" &&
    body !== null &&
    "error" in body &&
    typeof (body as ApiErrorBody).error?.message === "string"
  )
}

/**
 * Prefers the route's own message when there is one, so a `403` reads as
 * "Only the project owner…" rather than "Request failed with status 403."
 */
async function readErrorMessage(response: Response): Promise<string> {
  try {
    const body: unknown = await response.json()

    if (isApiErrorBody(body)) {
      return body.error.message
    }
  } catch {
    // Fall through to the status-based message.
  }

  return `Request failed with status ${response.status}.`
}

async function requestJson<T>(url: string, init: RequestInit = {}): Promise<T> {
  const response = await fetch(url, {
    ...init,
    headers: init.body
      ? { "Content-Type": "application/json", ...init.headers }
      : init.headers,
  })

  if (!response.ok) {
    throw new Error(await readErrorMessage(response))
  }

  return (await response.json()) as T
}

export { requestJson }

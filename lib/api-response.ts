/**
 * Error vocabulary for `app/api`. Handlers pick a code, not a status number, so
 * the same failure always answers with the same status and body shape.
 */
type ApiErrorCode = "invalid_request" | "unauthorized" | "forbidden" | "not_found"

interface ApiErrorBody {
  error: {
    code: ApiErrorCode
    message: string
  }
}

const API_ERROR_STATUS: Record<ApiErrorCode, number> = {
  invalid_request: 400,
  unauthorized: 401,
  forbidden: 403,
  not_found: 404,
}

function apiError(code: ApiErrorCode, message: string): Response {
  return Response.json({ error: { code, message } } satisfies ApiErrorBody, {
    status: API_ERROR_STATUS[code],
  })
}

/** The request body failed validation before any logic ran. */
function invalidRequest(message: string): Response {
  return apiError("invalid_request", message)
}

/** No signed-in Clerk user. */
function unauthorized(): Response {
  return apiError("unauthorized", "You must be signed in to perform this action.")
}

/** Signed in, but not the owner of the project being mutated. */
function forbidden(): Response {
  return apiError("forbidden", "Only the project owner can perform this action.")
}

function notFound(): Response {
  return apiError("not_found", "Project not found.")
}

export type { ApiErrorBody, ApiErrorCode }
export { apiError, forbidden, invalidRequest, notFound, unauthorized }

/**
 * Error vocabulary for `app/api`. Handlers pick a code, not a status number, so
 * the same failure always answers with the same status and body shape.
 */
type ApiErrorCode =
  | "invalid_request"
  | "unauthorized"
  | "forbidden"
  | "not_found"
  | "conflict"

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
  conflict: 409,
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

/** Signed in, but not allowed to perform the action. */
function forbidden(message = "Only the project owner can perform this action."): Response {
  return apiError("forbidden", message)
}

/**
 * Also the answer for "this project exists but you were not invited to it":
 * a 403 there would confirm the project is real to someone who cannot see it.
 */
function notFound(message = "Project not found."): Response {
  return apiError("not_found", message)
}

/** The request was valid but conflicts with what is already stored. */
function conflict(message: string): Response {
  return apiError("conflict", message)
}

export type { ApiErrorBody, ApiErrorCode }
export { apiError, conflict, forbidden, invalidRequest, notFound, unauthorized }

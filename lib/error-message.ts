/**
 * The message to show a user for a failed request. `lib/api-client.ts` throws
 * `Error`s that already carry the route's own message, so that is preferred;
 * anything else (a non-`Error` throw, an empty message) gets the caller's
 * action-specific fallback.
 */
function readErrorMessage(error: unknown, fallback: string): string {
  return error instanceof Error && error.message !== "" ? error.message : fallback
}

export { readErrorMessage }

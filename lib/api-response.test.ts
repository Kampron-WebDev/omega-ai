import { describe, expect, it } from "vitest"

import {
  apiError,
  conflict,
  forbidden,
  invalidRequest,
  notFound,
  unauthorized,
  type ApiErrorCode,
} from "@/lib/api-response"

async function expectError(
  response: Response,
  status: number,
  code: ApiErrorCode,
  message?: string,
) {
  expect(response.status).toBe(status)
  expect(response.headers.get("content-type")).toContain("application/json")
  expect(await response.json()).toEqual({
    error: { code, message: message ?? expect.any(String) },
  })
}

describe("api-response", () => {
  it.each<[ApiErrorCode, number]>([
    ["invalid_request", 400],
    ["unauthorized", 401],
    ["forbidden", 403],
    ["not_found", 404],
    ["conflict", 409],
  ])("maps %s to %i", async (code, status) => {
    await expectError(apiError(code, "Something."), status, code, "Something.")
  })

  it("invalidRequest answers 400 with the given message", async () => {
    await expectError(invalidRequest("Bad body."), 400, "invalid_request", "Bad body.")
  })

  it("unauthorized answers 401", async () => {
    await expectError(unauthorized(), 401, "unauthorized")
  })

  it("forbidden answers 403 with a default or custom message", async () => {
    await expectError(forbidden(), 403, "forbidden")
    await expectError(forbidden("No."), 403, "forbidden", "No.")
  })

  it("notFound answers 404 with a default or custom message", async () => {
    await expectError(notFound(), 404, "not_found", "Project not found.")
    await expectError(notFound("Gone."), 404, "not_found", "Gone.")
  })

  it("conflict answers 409 with the given message", async () => {
    await expectError(conflict("Already there."), 409, "conflict", "Already there.")
  })
})

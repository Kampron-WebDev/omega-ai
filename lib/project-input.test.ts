import { describe, expect, it } from "vitest"

import {
  DEFAULT_PROJECT_NAME,
  MAX_EMAIL_LENGTH,
  MAX_PROJECT_NAME_LENGTH,
  parseCollaboratorEmail,
  parseProjectName,
  parseRoomId,
  readJsonObject,
} from "@/lib/project-input"

function requestWithBody(body?: string): Request {
  return new Request("http://localhost/api/projects", { method: "POST", body })
}

describe("readJsonObject", () => {
  it("parses a JSON object", async () => {
    expect(await readJsonObject(requestWithBody('{"name":"Demo"}'))).toEqual({
      ok: true,
      value: { name: "Demo" },
    })
  })

  it("treats an absent or blank body as an empty object", async () => {
    expect(await readJsonObject(requestWithBody())).toEqual({ ok: true, value: {} })
    expect(await readJsonObject(requestWithBody("  \n"))).toEqual({ ok: true, value: {} })
  })

  it("rejects invalid JSON", async () => {
    expect(await readJsonObject(requestWithBody("{name:"))).toEqual({
      ok: false,
      message: "Request body must be valid JSON.",
    })
  })

  it.each(["[]", "null", "42", '"text"'])("rejects the non-object body %s", async (body) => {
    expect(await readJsonObject(requestWithBody(body))).toEqual({
      ok: false,
      message: "Request body must be a JSON object.",
    })
  })
})

describe("parseProjectName", () => {
  it("trims a valid name", () => {
    expect(parseProjectName("  Payments API  ")).toEqual({ ok: true, value: "Payments API" })
  })

  it("requires a name when there is no fallback", () => {
    expect(parseProjectName(undefined)).toEqual({ ok: false, message: "`name` is required." })
    expect(parseProjectName(null)).toEqual({ ok: false, message: "`name` is required." })
  })

  it("rejects a blank name when there is no fallback", () => {
    expect(parseProjectName("   ")).toEqual({ ok: false, message: "`name` must not be empty." })
  })

  it("uses the fallback for a missing or blank name", () => {
    const options = { fallback: DEFAULT_PROJECT_NAME }
    const expected = { ok: true, value: DEFAULT_PROJECT_NAME }

    expect(parseProjectName(undefined, options)).toEqual(expected)
    expect(parseProjectName(null, options)).toEqual(expected)
    expect(parseProjectName("  ", options)).toEqual(expected)
  })

  it("rejects a name that is not a string, even with a fallback", () => {
    expect(parseProjectName(42, { fallback: DEFAULT_PROJECT_NAME })).toEqual({
      ok: false,
      message: "`name` must be a string.",
    })
  })

  it(`accepts ${MAX_PROJECT_NAME_LENGTH} characters and rejects more`, () => {
    expect(parseProjectName("a".repeat(MAX_PROJECT_NAME_LENGTH)).ok).toBe(true)
    expect(parseProjectName("a".repeat(MAX_PROJECT_NAME_LENGTH + 1))).toEqual({
      ok: false,
      message: `\`name\` must be at most ${MAX_PROJECT_NAME_LENGTH} characters.`,
    })
  })
})

describe("parseCollaboratorEmail", () => {
  it("returns a valid address normalized", () => {
    expect(parseCollaboratorEmail("  Bob@Example.com ")).toEqual({
      ok: true,
      value: "bob@example.com",
    })
  })

  it("requires an email", () => {
    expect(parseCollaboratorEmail(undefined)).toEqual({
      ok: false,
      message: "`email` is required.",
    })
    expect(parseCollaboratorEmail(null)).toEqual({ ok: false, message: "`email` is required." })
  })

  it("rejects a value that is not a string", () => {
    expect(parseCollaboratorEmail(["bob@example.com"])).toEqual({
      ok: false,
      message: "`email` must be a string.",
    })
  })

  it("rejects a blank email", () => {
    expect(parseCollaboratorEmail("   ")).toEqual({
      ok: false,
      message: "Enter an email address to invite.",
    })
  })

  it(`rejects an address longer than ${MAX_EMAIL_LENGTH} characters`, () => {
    const email = `${"a".repeat(MAX_EMAIL_LENGTH)}@example.com`

    expect(parseCollaboratorEmail(email)).toEqual({
      ok: false,
      message: `\`email\` must be at most ${MAX_EMAIL_LENGTH} characters.`,
    })
  })

  it.each(["bob", "bob@", "bob@example", "bob smith@example.com", "@example.com", "bob@.com"])(
    "rejects the malformed address %s",
    (email) => {
      expect(parseCollaboratorEmail(email)).toEqual({
        ok: false,
        message: "Enter a valid email address.",
      })
    },
  )
})

describe("parseRoomId", () => {
  it("trims a room ID", () => {
    expect(parseRoomId("  cm123abc ")).toEqual({ ok: true, value: "cm123abc" })
  })

  it.each([undefined, null, 42, "", "   "])("rejects %j", (value) => {
    expect(parseRoomId(value)).toEqual({ ok: false, message: "`room` is required." })
  })
})

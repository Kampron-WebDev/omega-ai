import { describe, expect, it } from "vitest"

import { readErrorMessage } from "@/lib/error-message"

describe("readErrorMessage", () => {
  it("prefers the Error's own message", () => {
    expect(readErrorMessage(new Error("Only the project owner can do that."), "Fallback.")).toBe(
      "Only the project owner can do that.",
    )
  })

  it("uses the fallback for an empty message or a non-Error throw", () => {
    expect(readErrorMessage(new Error(""), "Fallback.")).toBe("Fallback.")
    expect(readErrorMessage("boom", "Fallback.")).toBe("Fallback.")
    expect(readErrorMessage(undefined, "Fallback.")).toBe("Fallback.")
  })
})

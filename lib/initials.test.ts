import { describe, expect, it } from "vitest"

import { initialsFromName } from "@/lib/initials"

describe("initialsFromName", () => {
  it("uses the first letter of a single word", () => {
    expect(initialsFromName("ada")).toBe("A")
  })

  it("uses the first letters of the first two words", () => {
    expect(initialsFromName("Ada Lovelace")).toBe("AL")
    expect(initialsFromName("Ada King Lovelace")).toBe("AK")
  })

  it("skips punctuation and words without letters", () => {
    expect(initialsFromName("(ada) - lovelace")).toBe("AL")
  })

  it("accepts digits and non-Latin letters", () => {
    expect(initialsFromName("3d studio")).toBe("3S")
    expect(initialsFromName("émile zola")).toBe("ÉZ")
  })

  it("returns null when there is nothing to use", () => {
    expect(initialsFromName("")).toBeNull()
    expect(initialsFromName("   ")).toBeNull()
    expect(initialsFromName("-- !!")).toBeNull()
  })
})

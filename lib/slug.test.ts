import { describe, expect, it } from "vitest"

import { MAX_SLUG_LENGTH, slugify } from "@/lib/slug"

describe("slugify", () => {
  it("lowercases words and joins them with single hyphens", () => {
    expect(slugify("My Great Project")).toBe("my-great-project")
  })

  it("returns an empty string when nothing is sluggable", () => {
    expect(slugify("")).toBe("")
    expect(slugify("   ")).toBe("")
    expect(slugify("!!!")).toBe("")
  })

  it("strips accents and drops characters outside a-z and 0-9", () => {
    expect(slugify("Café Déjà Vu")).toBe("cafe-deja-vu")
    expect(slugify("東京 Tower")).toBe("tower")
  })

  it("collapses runs of separators and trims them from both ends", () => {
    expect(slugify("  --Hello__ ...World!!  ")).toBe("hello-world")
  })

  it(`cuts the slug at ${MAX_SLUG_LENGTH} characters`, () => {
    expect(slugify("a".repeat(MAX_SLUG_LENGTH + 20))).toHaveLength(MAX_SLUG_LENGTH)
  })

  it("does not end with a hyphen when the cut lands on a separator", () => {
    const slug = slugify(`${"a".repeat(MAX_SLUG_LENGTH - 1)} tail`)

    expect(slug).toBe("a".repeat(MAX_SLUG_LENGTH - 1))
  })
})

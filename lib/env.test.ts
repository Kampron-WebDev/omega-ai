import { afterEach, describe, expect, it, vi } from "vitest"

import { parseServerEnv } from "@/lib/env"

const completeEnv = {
  DATABASE_URL: "postgres://user:secret-password@localhost:5432/omega",
  LIVEBLOCKS_SECRET_KEY: "sk_live_secret",
  CLERK_SECRET_KEY: "sk_test_secret",
  NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY: "pk_test_key",
}

describe("parseServerEnv", () => {
  it("parses a complete environment and drops unrelated variables", () => {
    expect(parseServerEnv({ ...completeEnv, PATH: "/usr/bin" })).toEqual(completeEnv)
  })

  it("names every missing or empty variable in one error", () => {
    const parse = () =>
      parseServerEnv({
        DATABASE_URL: "   ",
        CLERK_SECRET_KEY: "",
      })

    expect(parse).toThrow(
      "DATABASE_URL, LIVEBLOCKS_SECRET_KEY, CLERK_SECRET_KEY, NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY",
    )
  })

  it("never puts a value in the error", () => {
    const parse = () => parseServerEnv({ ...completeEnv, LIVEBLOCKS_SECRET_KEY: undefined })

    expect(parse).toThrow("LIVEBLOCKS_SECRET_KEY")

    for (const value of Object.values(completeEnv)) {
      expect(parse).not.toThrow(value)
    }
  })
})

describe("getServerEnv", () => {
  afterEach(() => {
    vi.unstubAllEnvs()
    vi.resetModules()
  })

  it("parses process.env on first call and caches the result", async () => {
    for (const [name, value] of Object.entries(completeEnv)) {
      vi.stubEnv(name, value)
    }

    const { getServerEnv } = await import("@/lib/env")
    const first = getServerEnv()

    vi.stubEnv("DATABASE_URL", "postgres://changed")

    expect(first).toEqual(completeEnv)
    expect(getServerEnv()).toBe(first)
  })

  it("does not validate at import time", async () => {
    vi.stubEnv("DATABASE_URL", "")

    const { getServerEnv } = await import("@/lib/env")

    expect(getServerEnv).toThrow("DATABASE_URL")
  })
})

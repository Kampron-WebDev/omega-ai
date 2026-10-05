import { beforeEach, describe, expect, it, vi } from "vitest"

const findMany = vi.fn()

vi.mock("@/lib/prisma", () => ({
  prisma: { project: { findMany } },
}))

const { listProjectsForIdentity } = await import("@/lib/projects")

describe("listProjectsForIdentity", () => {
  beforeEach(() => {
    findMany.mockReset()
  })

  it("returns both lists with a derived slug, the role, and updatedAt as ISO", async () => {
    findMany
      .mockResolvedValueOnce([
        { id: "p1", name: "Payments API", updatedAt: new Date("2026-09-29T10:00:00.000Z") },
      ])
      .mockResolvedValueOnce([
        { id: "p2", name: "Chat Platform", updatedAt: new Date("2026-09-30T08:30:00.000Z") },
      ])

    const lists = await listProjectsForIdentity({ userId: "user_1", email: "ada@example.com" })

    expect(lists).toEqual({
      owned: [
        {
          id: "p1",
          name: "Payments API",
          slug: "payments-api",
          role: "owner",
          updatedAt: "2026-09-29T10:00:00.000Z",
        },
      ],
      shared: [
        {
          id: "p2",
          name: "Chat Platform",
          slug: "chat-platform",
          role: "collaborator",
          updatedAt: "2026-09-30T08:30:00.000Z",
        },
      ],
    })
  })

  it("selects updatedAt from the database", async () => {
    findMany.mockResolvedValue([])

    await listProjectsForIdentity({ userId: "user_1", email: "ada@example.com" })

    for (const [query] of findMany.mock.calls) {
      expect(query.select).toMatchObject({ updatedAt: true })
    }
  })

  it("skips the shared query when the identity has no email", async () => {
    findMany.mockResolvedValue([])

    const lists = await listProjectsForIdentity({ userId: "user_1", email: null })

    expect(findMany).toHaveBeenCalledTimes(1)
    expect(lists.shared).toEqual([])
  })
})

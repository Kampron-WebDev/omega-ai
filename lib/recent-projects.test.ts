import { describe, expect, it } from "vitest"

import { MAX_RECENT_PROJECTS, selectRecentProjects } from "@/lib/recent-projects"
import type { Project } from "@/types/project"

function project(id: string, updatedAt: string, role: Project["role"] = "owner"): Project {
  return { id, name: id, slug: id, role, updatedAt }
}

describe("selectRecentProjects", () => {
  it("merges owned and shared projects, most recently edited first", () => {
    const owned = [project("a", "2026-09-01T00:00:00.000Z"), project("b", "2026-09-03T00:00:00.000Z")]
    const shared = [project("c", "2026-09-02T00:00:00.000Z", "collaborator")]

    expect(selectRecentProjects(owned, shared).map((entry) => entry.id)).toEqual(["b", "c", "a"])
  })

  it(`keeps at most ${MAX_RECENT_PROJECTS}`, () => {
    const owned = Array.from({ length: MAX_RECENT_PROJECTS + 5 }, (_, index) =>
      project(`p${index}`, new Date(Date.UTC(2026, 0, index + 1)).toISOString()),
    )

    const recent = selectRecentProjects(owned, [])

    expect(recent).toHaveLength(MAX_RECENT_PROJECTS)
    expect(recent[0].id).toBe(`p${MAX_RECENT_PROJECTS + 4}`)
  })

  it("returns an empty list when there are no projects", () => {
    expect(selectRecentProjects([], [])).toEqual([])
  })

  it("does not reorder the caller's arrays", () => {
    const owned = [project("a", "2026-09-01T00:00:00.000Z"), project("b", "2026-09-03T00:00:00.000Z")]

    selectRecentProjects(owned, [])

    expect(owned.map((entry) => entry.id)).toEqual(["a", "b"])
  })
})

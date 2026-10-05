import type { Project } from "@/types/project"

/** How many projects the editor home's "Recent projects" grid shows. */
const MAX_RECENT_PROJECTS = 12

/**
 * Owned and shared projects as one list, most recently edited first. The two
 * lists never overlap (`listProjectsForIdentity` keeps an owner's own project
 * out of `shared`), so merging needs no de-duplication.
 */
function selectRecentProjects(
  owned: Project[],
  shared: Project[],
  limit = MAX_RECENT_PROJECTS,
): Project[] {
  return [...owned, ...shared]
    .sort((a, b) => Date.parse(b.updatedAt) - Date.parse(a.updatedAt))
    .slice(0, limit)
}

export { MAX_RECENT_PROJECTS, selectRecentProjects }

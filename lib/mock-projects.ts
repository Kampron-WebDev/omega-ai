import { slugify } from "@/lib/slug"
import type { Project, ProjectRole } from "@/types/project"

function createMockProject(name: string, role: ProjectRole): Project {
  const slug = slugify(name)

  return { id: `prj_${slug}`, name, slug, role }
}

/**
 * Placeholder project data for the editor shell.
 *
 * Temporary: replaced by Prisma-backed project records once the persistence
 * chapter lands. Nothing here is written to or read from a real store.
 */
const MOCK_PROJECTS: Project[] = [
  createMockProject("Realtime Chat Platform", "owner"),
  createMockProject("Payments Ledger", "owner"),
  createMockProject("Fleet Telemetry Pipeline", "owner"),
  createMockProject("Acme Checkout Redesign", "collaborator"),
  createMockProject("Internal Search Service", "collaborator"),
]

export { MOCK_PROJECTS }

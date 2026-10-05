import Link from "next/link"

import { formatRelativeTime } from "@/lib/relative-time"
import type { Project } from "@/types/project"

interface RecentProjectsProps {
  projects: Project[]
  /**
   * The instant the page was rendered on the server, as an ISO string. The
   * browser formats "Edited 3h ago" against the same instant, so hydration
   * never sees a different label than the server sent.
   */
  now: string
}

const ROLE_LABELS: Record<Project["role"], string> = {
  owner: "Owner",
  collaborator: "Shared",
}

function RecentProjects({ projects, now }: RecentProjectsProps) {
  if (projects.length === 0) {
    return null
  }

  const renderedAt = new Date(now)

  return (
    <section aria-labelledby="recent-projects-heading" className="w-full max-w-4xl">
      <h2
        id="recent-projects-heading"
        className="mb-3 text-left text-sm font-medium text-muted-foreground"
      >
        Recent projects
      </h2>

      <ul className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {projects.map((project) => (
          <li key={project.id}>
            <Link
              href={`/editor/${project.id}`}
              className="flex h-full flex-col gap-2 rounded-2xl border border-border/50 bg-card p-4 text-left transition-colors outline-none hover:bg-muted/60 focus-visible:ring-3 focus-visible:ring-ring/50"
            >
              <span className="truncate text-sm font-medium text-foreground">
                {project.name}
              </span>
              <span className="flex items-center justify-between gap-2 text-xs text-muted-foreground">
                <span className="rounded-md bg-muted px-1.5 py-0.5">
                  {ROLE_LABELS[project.role]}
                </span>
                <time dateTime={project.updatedAt}>
                  Edited {formatRelativeTime(project.updatedAt, renderedAt)}
                </time>
              </span>
            </Link>
          </li>
        ))}
      </ul>
    </section>
  )
}

export { RecentProjects }

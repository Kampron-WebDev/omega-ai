"use client"

import { Plus } from "lucide-react"

import { RecentProjects } from "@/components/editor/recent-projects"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import type { Project } from "@/types/project"

interface EditorHomeProps {
  onCreateProject: () => void
  /** Already merged, sorted, and capped by the page (`selectRecentProjects`). */
  recentProjects: Project[]
  /** The server's render time, passed through to `RecentProjects`. */
  now: string
  className?: string
}

function EditorHome({
  onCreateProject,
  recentProjects,
  now,
  className,
}: EditorHomeProps) {
  return (
    // The scroll container is the outer box and the content centers itself
    // with `m-auto`, so a long project grid scrolls instead of being clipped
    // above the fold the way `justify-center` would clip it.
    <div
      data-slot="editor-home"
      className={cn("flex flex-1 overflow-y-auto px-6", className)}
    >
      <div className="m-auto flex w-full flex-col items-center gap-10 py-10 text-center">
        <div className="flex flex-col items-center gap-5">
          <div className="flex max-w-md flex-col gap-2">
            <h1 className="font-heading text-xl font-medium tracking-tight text-balance">
              Create a project or open an existing one
            </h1>
            <p className="text-sm text-balance text-muted-foreground">
              Start a new architecture workspace, or choose a project from the
              sidebar.
            </p>
          </div>

          <Button size="lg" onClick={onCreateProject}>
            <Plus />
            New Project
          </Button>
        </div>

        <RecentProjects projects={recentProjects} now={now} />
      </div>
    </div>
  )
}

export { EditorHome }

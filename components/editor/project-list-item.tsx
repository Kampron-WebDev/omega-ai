"use client"

import { Pencil, Trash2 } from "lucide-react"

import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import type { Project } from "@/types/project"

interface ProjectListItemProps {
  project: Project
  onRename: (project: Project) => void
  onDelete: (project: Project) => void
}

// Revealed on hover or keyboard focus, and always visible on touch devices,
// which have no hover state to reveal them with.
const ACTIONS_VISIBILITY =
  "opacity-0 transition-opacity group-hover/project:opacity-100 group-focus-within/project:opacity-100 [@media(hover:none)]:opacity-100"

function ProjectListItem({
  project,
  onRename,
  onDelete,
}: ProjectListItemProps) {
  // Only the owner can rename or delete a project; collaborators see the entry
  // without actions.
  const canManage = project.role === "owner"

  return (
    <li className="group/project flex items-center gap-1 rounded-lg px-2 py-1.5 transition-colors hover:bg-muted/60 focus-within:bg-muted/60">
      <div className="flex min-w-0 flex-1 flex-col">
        <span className="truncate text-sm text-foreground">{project.name}</span>
        <span className="truncate font-mono text-xs text-muted-foreground">
          {project.slug}
        </span>
      </div>

      {canManage ? (
        <div className={cn("flex shrink-0 items-center gap-0.5", ACTIONS_VISIBILITY)}>
          <Button
            variant="ghost"
            size="icon-xs"
            onClick={() => onRename(project)}
            aria-label={`Rename ${project.name}`}
          >
            <Pencil />
          </Button>
          <Button
            variant="ghost"
            size="icon-xs"
            onClick={() => onDelete(project)}
            aria-label={`Delete ${project.name}`}
            className="hover:bg-destructive/10 hover:text-destructive"
          >
            <Trash2 />
          </Button>
        </div>
      ) : null}
    </li>
  )
}

export { ProjectListItem }

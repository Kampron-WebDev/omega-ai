"use client"

import { Plus } from "lucide-react"

import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"

interface EditorHomeProps {
  onCreateProject: () => void
  className?: string
}

function EditorHome({ onCreateProject, className }: EditorHomeProps) {
  return (
    <div
      data-slot="editor-home"
      className={cn(
        "flex flex-1 flex-col items-center justify-center gap-5 px-6 text-center",
        className
      )}
    >
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
  )
}

export { EditorHome }

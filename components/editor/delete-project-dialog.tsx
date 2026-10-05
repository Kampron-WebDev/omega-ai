"use client"

import { Loader2 } from "lucide-react"

import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import type { Project } from "@/types/project"

interface DeleteProjectDialogProps {
  open: boolean
  project: Project | null
  error: string | null
  isSubmitting: boolean
  canSubmit: boolean
  onOpenChange: (open: boolean) => void
  onSubmit: () => void
}

const ERROR_ID = "delete-project-error"

function DeleteProjectDialog({
  open,
  project,
  error,
  isSubmitting,
  canSubmit,
  onOpenChange,
  onSubmit,
}: DeleteProjectDialogProps) {
  if (!project) {
    return null
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Delete project</DialogTitle>
          <DialogDescription>
            &ldquo;{project.name}&rdquo; and everything in it will be permanently
            deleted. This cannot be undone.
          </DialogDescription>
        </DialogHeader>

        {error ? (
          <p id={ERROR_ID} role="alert" className="text-sm text-destructive">
            {error}
          </p>
        ) : null}

        <DialogFooter>
          <DialogClose render={<Button variant="outline" />}>
            Cancel
          </DialogClose>
          <Button
            variant="destructive"
            disabled={!canSubmit}
            onClick={onSubmit}
            aria-describedby={error ? ERROR_ID : undefined}
          >
            {isSubmitting ? <Loader2 className="animate-spin" /> : null}
            Delete project
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

export { DeleteProjectDialog }

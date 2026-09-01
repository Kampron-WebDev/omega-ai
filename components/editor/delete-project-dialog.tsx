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
  isSubmitting: boolean
  canSubmit: boolean
  onOpenChange: (open: boolean) => void
  onSubmit: () => void
}

function DeleteProjectDialog({
  open,
  project,
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

        <DialogFooter>
          <DialogClose
            render={<Button variant="outline" disabled={isSubmitting} />}
          >
            Cancel
          </DialogClose>
          <Button variant="destructive" disabled={!canSubmit} onClick={onSubmit}>
            {isSubmitting ? <Loader2 className="animate-spin" /> : null}
            Delete project
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

export { DeleteProjectDialog }

"use client"

import type { FormEvent } from "react"
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
import { Input } from "@/components/ui/input"

interface CreateProjectDialogProps {
  open: boolean
  name: string
  slugPreview: string
  isSubmitting: boolean
  canSubmit: boolean
  onNameChange: (name: string) => void
  onOpenChange: (open: boolean) => void
  onSubmit: () => void
}

const NAME_INPUT_ID = "create-project-name"
const SLUG_PREVIEW_ID = "create-project-slug"

function CreateProjectDialog({
  open,
  name,
  slugPreview,
  isSubmitting,
  canSubmit,
  onNameChange,
  onOpenChange,
  onSubmit,
}: CreateProjectDialogProps) {
  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    onSubmit()
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>New project</DialogTitle>
          <DialogDescription>
            Name your architecture workspace. You can rename it later.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="grid gap-4">
          <div className="grid gap-2">
            <label
              htmlFor={NAME_INPUT_ID}
              className="text-sm font-medium text-foreground"
            >
              Project name
            </label>
            <Input
              id={NAME_INPUT_ID}
              value={name}
              onChange={(event) => onNameChange(event.target.value)}
              placeholder="Realtime chat platform"
              autoComplete="off"
              spellCheck={false}
              disabled={isSubmitting}
              aria-describedby={SLUG_PREVIEW_ID}
            />
            <p
              id={SLUG_PREVIEW_ID}
              aria-live="polite"
              className="flex items-baseline gap-1.5 text-xs text-muted-foreground"
            >
              <span className="shrink-0">Slug</span>
              <code className="truncate rounded-sm bg-muted px-1.5 py-0.5 font-mono text-foreground">
                {slugPreview || "project-name"}
              </code>
            </p>
          </div>

          <DialogFooter>
            <DialogClose
              render={<Button variant="outline" disabled={isSubmitting} />}
            >
              Cancel
            </DialogClose>
            <Button type="submit" disabled={!canSubmit}>
              {isSubmitting ? <Loader2 className="animate-spin" /> : null}
              Create project
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}

export { CreateProjectDialog }

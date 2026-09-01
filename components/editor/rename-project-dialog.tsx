"use client"

import { useEffect, useRef, type FocusEvent, type FormEvent } from "react"
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
import type { Project } from "@/types/project"

interface RenameProjectDialogProps {
  open: boolean
  project: Project | null
  name: string
  isSubmitting: boolean
  canSubmit: boolean
  onNameChange: (name: string) => void
  onOpenChange: (open: boolean) => void
  onSubmit: () => void
}

const NAME_INPUT_ID = "rename-project-name"

function RenameProjectDialog({
  open,
  project,
  name,
  isSubmitting,
  canSubmit,
  onNameChange,
  onOpenChange,
  onSubmit,
}: RenameProjectDialogProps) {
  const inputRef = useRef<HTMLInputElement>(null)
  // Select the existing name once when the dialog opens, so typing replaces it —
  // without hijacking later clicks that are trying to place the caret.
  const hasSelectedOnOpen = useRef(false)

  useEffect(() => {
    if (!open) {
      hasSelectedOnOpen.current = false
    }
  }, [open])

  function handleInitialFocus(event: FocusEvent<HTMLInputElement>) {
    if (hasSelectedOnOpen.current) {
      return
    }

    hasSelectedOnOpen.current = true
    event.currentTarget.select()
  }

  if (!project) {
    return null
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    onSubmit()
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      {/* Focus the field rather than the popup so typing starts immediately. */}
      <DialogContent initialFocus={inputRef}>
        <DialogHeader>
          <DialogTitle>Rename project</DialogTitle>
          <DialogDescription>
            Currently named &ldquo;{project.name}&rdquo;.
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
              ref={inputRef}
              value={name}
              onChange={(event) => onNameChange(event.target.value)}
              onFocus={handleInitialFocus}
              autoComplete="off"
              spellCheck={false}
              disabled={isSubmitting}
            />
          </div>

          <DialogFooter>
            <DialogClose
              render={<Button variant="outline" disabled={isSubmitting} />}
            >
              Cancel
            </DialogClose>
            <Button type="submit" disabled={!canSubmit}>
              {isSubmitting ? <Loader2 className="animate-spin" /> : null}
              Save changes
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}

export { RenameProjectDialog }

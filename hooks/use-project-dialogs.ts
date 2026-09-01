"use client"

import { useCallback, useMemo, useState } from "react"

import { slugify } from "@/lib/slug"
import type {
  Project,
  ProjectDialogIntent,
  ProjectDialogKind,
} from "@/types/project"

interface UseProjectDialogsOptions {
  /**
   * Called with the confirmed mutation when a dialog is submitted. May be async:
   * the dialog stays open and reports a loading state until it settles, and only
   * closes if it resolves.
   */
  onSubmit?: (intent: ProjectDialogIntent) => void | Promise<void>
}

interface ProjectDialogsController {
  /** The dialog currently open, or `null` when all are closed. */
  openDialog: ProjectDialogKind | null
  /**
   * The project a rename/delete dialog is acting on. Retained after close so the
   * dialog keeps its content through the exit animation.
   */
  activeProject: Project | null
  name: string
  /** Live slug derived from `name`. Empty when the name has nothing sluggable. */
  slugPreview: string
  isSubmitting: boolean
  canSubmit: boolean
  setName: (name: string) => void
  openCreateDialog: () => void
  openRenameDialog: (project: Project) => void
  openDeleteDialog: (project: Project) => void
  closeDialog: () => void
  submit: () => void
}

/**
 * Owns every piece of project-dialog state: which dialog is open, the name being
 * edited, the derived slug, and the in-flight submit state. Keeping it in one
 * hook means the editor home, the sidebar, and the dialogs all drive the same
 * state instead of each holding a copy.
 */
function useProjectDialogs(
  options: UseProjectDialogsOptions = {}
): ProjectDialogsController {
  const { onSubmit } = options

  const [openDialog, setOpenDialog] = useState<ProjectDialogKind | null>(null)
  const [activeProject, setActiveProject] = useState<Project | null>(null)
  const [name, setName] = useState("")
  const [isSubmitting, setIsSubmitting] = useState(false)

  const trimmedName = name.trim()
  const slugPreview = useMemo(() => slugify(name), [name])

  const canSubmit = useMemo(() => {
    if (isSubmitting) {
      return false
    }

    switch (openDialog) {
      case "create":
        return slugPreview.length > 0
      case "rename":
        return slugPreview.length > 0 && trimmedName !== activeProject?.name
      case "delete":
        return activeProject !== null
      default:
        return false
    }
  }, [activeProject, isSubmitting, openDialog, slugPreview, trimmedName])

  const openCreateDialog = useCallback(() => {
    setActiveProject(null)
    setName("")
    setOpenDialog("create")
  }, [])

  const openRenameDialog = useCallback((project: Project) => {
    setActiveProject(project)
    setName(project.name)
    setOpenDialog("rename")
  }, [])

  const openDeleteDialog = useCallback((project: Project) => {
    setActiveProject(project)
    setName(project.name)
    setOpenDialog("delete")
  }, [])

  const closeDialog = useCallback(() => {
    // A dialog must not disappear out from under an in-flight submit.
    if (isSubmitting) {
      return
    }

    setOpenDialog(null)
  }, [isSubmitting])

  const submit = useCallback(() => {
    if (!canSubmit) {
      return
    }

    let intent: ProjectDialogIntent | null = null

    switch (openDialog) {
      case "create":
        intent = { kind: "create", name: trimmedName, slug: slugPreview }
        break
      case "rename":
        if (activeProject) {
          intent = {
            kind: "rename",
            project: activeProject,
            name: trimmedName,
            slug: slugPreview,
          }
        }
        break
      case "delete":
        if (activeProject) {
          intent = { kind: "delete", project: activeProject }
        }
        break
      default:
        intent = null
    }

    if (!intent) {
      return
    }

    const confirmedIntent = intent

    const run = async () => {
      setIsSubmitting(true)

      try {
        await onSubmit?.(confirmedIntent)
        setOpenDialog(null)
      } catch (error) {
        // No error surface is defined for this phase; keep the dialog open with
        // the user's input intact rather than swallowing the failure silently.
        console.error("Project dialog submit failed", error)
      } finally {
        setIsSubmitting(false)
      }
    }

    void run()
  }, [activeProject, canSubmit, onSubmit, openDialog, slugPreview, trimmedName])

  return {
    openDialog,
    activeProject,
    name,
    slugPreview,
    isSubmitting,
    canSubmit,
    setName,
    openCreateDialog,
    openRenameDialog,
    openDeleteDialog,
    closeDialog,
    submit,
  }
}

export { useProjectDialogs }
export type { ProjectDialogsController, UseProjectDialogsOptions }

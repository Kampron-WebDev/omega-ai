"use client"

import { useCallback, useMemo, useRef, useState } from "react"

import { readErrorMessage } from "@/lib/error-message"
import { slugify } from "@/lib/slug"
import type {
  Project,
  ProjectDialogIntent,
  ProjectDialogKind,
} from "@/types/project"

interface UseProjectDialogsOptions {
  /**
   * Called with the confirmed mutation when a dialog is submitted. May be async:
   * the dialog stays open and reports a loading state until it settles, closes
   * if it resolves, and shows the thrown message if it rejects.
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
  /** Why the last submit failed, shown inline in the open dialog. */
  error: string | null
  isSubmitting: boolean
  canSubmit: boolean
  setName: (name: string) => void
  openCreateDialog: () => void
  openRenameDialog: (project: Project) => void
  openDeleteDialog: (project: Project) => void
  closeDialog: () => void
  submit: () => void
}

const FALLBACK_ERRORS: Record<ProjectDialogKind, string> = {
  create: "Couldn't create the project.",
  rename: "Couldn't rename the project.",
  delete: "Couldn't delete the project.",
}

/**
 * Owns every piece of project-dialog state: which dialog is open, the name being
 * edited, the derived slug, the in-flight submit state, and the last error.
 * Keeping it in one hook means the editor home, the sidebar, and the dialogs all
 * drive the same state instead of each holding a copy.
 */
function useProjectDialogs(
  options: UseProjectDialogsOptions = {}
): ProjectDialogsController {
  const { onSubmit } = options

  const [openDialog, setOpenDialog] = useState<ProjectDialogKind | null>(null)
  const [activeProject, setActiveProject] = useState<Project | null>(null)
  const [name, setNameState] = useState("")
  const [error, setError] = useState<string | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)

  // Every open and close starts a new session. A submit remembers the session
  // it began in, so a result that lands after the dialog was closed (or
  // reopened for something else) cannot close, or show an error in, a dialog
  // it no longer belongs to.
  const sessionRef = useRef(0)
  // The session with a request in flight. A ref rather than state, because two
  // clicks in the same frame both run before a state update would re-render.
  const inFlightSessionRef = useRef<number | null>(null)

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

  const startSession = useCallback(
    (dialog: ProjectDialogKind | null, project: Project | null, initialName: string) => {
      sessionRef.current += 1
      setError(null)
      setIsSubmitting(false)
      setNameState(initialName)
      // The project is kept on close so the dialog's content survives its exit
      // animation.
      if (dialog !== null) {
        setActiveProject(project)
      }
      setOpenDialog(dialog)
    },
    []
  )

  const setName = useCallback((value: string) => {
    setNameState(value)
    setError(null)
  }, [])

  const openCreateDialog = useCallback(() => {
    startSession("create", null, "")
  }, [startSession])

  const openRenameDialog = useCallback(
    (project: Project) => {
      startSession("rename", project, project.name)
    },
    [startSession]
  )

  const openDeleteDialog = useCallback(
    (project: Project) => {
      startSession("delete", project, project.name)
    },
    [startSession]
  )

  const closeDialog = useCallback(() => {
    // Allowed mid-submit: the request carries on, but its result is ignored
    // (see `sessionRef`). The name is kept for the exit animation.
    sessionRef.current += 1
    setError(null)
    setIsSubmitting(false)
    setOpenDialog(null)
  }, [])

  const submit = useCallback(() => {
    const session = sessionRef.current

    if (!canSubmit || openDialog === null || inFlightSessionRef.current === session) {
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
    }

    if (!intent) {
      return
    }

    const confirmedIntent = intent
    const fallbackError = FALLBACK_ERRORS[openDialog]

    const run = async () => {
      inFlightSessionRef.current = session
      setIsSubmitting(true)
      setError(null)

      try {
        await onSubmit?.(confirmedIntent)

        if (sessionRef.current === session) {
          setOpenDialog(null)
        }
      } catch (submitError) {
        if (sessionRef.current === session) {
          setError(readErrorMessage(submitError, fallbackError))
        }
      } finally {
        if (inFlightSessionRef.current === session) {
          inFlightSessionRef.current = null
        }

        if (sessionRef.current === session) {
          setIsSubmitting(false)
        }
      }
    }

    void run()
  }, [activeProject, canSubmit, onSubmit, openDialog, slugPreview, trimmedName])

  return {
    openDialog,
    activeProject,
    name,
    slugPreview,
    error,
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

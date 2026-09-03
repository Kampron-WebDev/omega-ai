"use client"

import { useCallback, useEffect, useMemo, useState } from "react"

import {
  inviteCollaboratorRequest,
  listCollaboratorsRequest,
  removeCollaboratorRequest,
} from "@/lib/collaborator-api"
import type { Collaborator } from "@/types/collaborator"

/** Stable empty list, so "not loaded yet" does not churn the memo below. */
const NO_COLLABORATORS: Collaborator[] = []

interface UseCollaboratorsOptions {
  projectId: string
  /** The hook only talks to the network while the share dialog is open. */
  isOpen: boolean
}

/**
 * The last completed load. Tagged with the project it belongs to so switching
 * projects shows a spinner rather than the previous project's collaborators.
 */
interface LoadedList {
  projectId: string
  collaborators: Collaborator[]
  error: string | null
}

interface CollaboratorsController {
  collaborators: Collaborator[]
  isLoading: boolean
  /** Why the list could not be loaded. The invite form stays usable regardless. */
  loadError: string | null
  email: string
  setEmail: (email: string) => void
  isInviting: boolean
  canInvite: boolean
  /** Why the last invite or removal failed, shown under the list. */
  actionError: string | null
  invite: () => void
  /** The collaborator being removed, so only that row shows a spinner. */
  removingId: string | null
  remove: (collaborator: Collaborator) => void
}

function readErrorMessage(error: unknown, fallback: string): string {
  return error instanceof Error && error.message !== "" ? error.message : fallback
}

/**
 * All of the share dialog's server state: the collaborator list, the invite
 * field, and the in-flight state of both mutations.
 *
 * Owner-only actions are enforced by the routes, not here — this hook is happy
 * to call them, and a collaborator simply never sees the controls that do.
 */
function useCollaborators({
  projectId,
  isOpen,
}: UseCollaboratorsOptions): CollaboratorsController {
  const [loaded, setLoaded] = useState<LoadedList | null>(null)
  const [email, setEmail] = useState("")
  const [isInviting, setIsInviting] = useState(false)
  const [actionError, setActionError] = useState<string | null>(null)
  const [removingId, setRemovingId] = useState<string | null>(null)

  // Loading is derived from what has been loaded rather than tracked in its own
  // state, so opening the dialog does not cost an extra render just to raise a
  // flag. Reopening re-fetches, but keeps showing the rows it already has
  // instead of flashing a spinner over a list that is almost certainly correct.
  const isCurrent = loaded !== null && loaded.projectId === projectId
  const collaborators = isCurrent ? loaded.collaborators : NO_COLLABORATORS
  const loadError = isCurrent ? loaded.error : null
  const isLoading = isOpen && !isCurrent

  useEffect(() => {
    if (!isOpen) {
      return
    }

    const controller = new AbortController()

    const run = async () => {
      try {
        const rows = await listCollaboratorsRequest(projectId, controller.signal)

        setLoaded({ projectId, collaborators: rows, error: null })
        // A failed invite from a previous open is not this session's news.
        setActionError(null)
      } catch (error) {
        // An abort means the dialog closed, not that anything went wrong.
        if (controller.signal.aborted) {
          return
        }

        setLoaded({
          projectId,
          collaborators: [],
          error: readErrorMessage(error, "Couldn't load collaborators."),
        })
      }
    }

    void run()

    return () => {
      controller.abort()
    }
  }, [isOpen, projectId])

  /**
   * Applies a local edit to the loaded list. Guarded by project so a response
   * that lands after the dialog moved on cannot write into the wrong list.
   */
  const updateLoaded = useCallback(
    (update: (collaborators: Collaborator[]) => Collaborator[]) => {
      setLoaded((current) =>
        current !== null && current.projectId === projectId
          ? { ...current, collaborators: update(current.collaborators) }
          : current,
      )
    },
    [projectId],
  )

  const trimmedEmail = email.trim()
  const canInvite = trimmedEmail !== "" && !isInviting

  const invite = useCallback(() => {
    if (!canInvite) {
      return
    }

    const run = async () => {
      setIsInviting(true)
      setActionError(null)

      try {
        const collaborator = await inviteCollaboratorRequest(projectId, trimmedEmail)

        // Appended rather than re-fetched: the route already returned the row
        // exactly as the list renders it, Clerk enrichment included.
        updateLoaded((current) => [...current, collaborator])
        setEmail("")
      } catch (error) {
        // The address stays in the field so a rejected invite can be corrected
        // rather than retyped.
        setActionError(readErrorMessage(error, "Couldn't send that invite."))
      } finally {
        setIsInviting(false)
      }
    }

    void run()
  }, [canInvite, projectId, trimmedEmail, updateLoaded])

  const remove = useCallback(
    (collaborator: Collaborator) => {
      if (removingId !== null) {
        return
      }

      const run = async () => {
        setRemovingId(collaborator.id)
        setActionError(null)

        try {
          await removeCollaboratorRequest(projectId, collaborator.id)
          updateLoaded((current) =>
            current.filter((entry) => entry.id !== collaborator.id),
          )
        } catch (error) {
          setActionError(readErrorMessage(error, "Couldn't remove that collaborator."))
        } finally {
          setRemovingId(null)
        }
      }

      void run()
    },
    [projectId, removingId, updateLoaded],
  )

  return useMemo(
    () => ({
      collaborators,
      isLoading,
      loadError,
      email,
      setEmail,
      isInviting,
      canInvite,
      actionError,
      invite,
      removingId,
      remove,
    }),
    [
      actionError,
      canInvite,
      collaborators,
      email,
      invite,
      isInviting,
      isLoading,
      loadError,
      remove,
      removingId,
    ],
  )
}

export { useCollaborators }
export type { CollaboratorsController, UseCollaboratorsOptions }

"use client"

import { useCallback } from "react"
import { useRouter } from "next/navigation"

import {
  createProjectRequest,
  deleteProjectRequest,
  renameProjectRequest,
} from "@/lib/project-api"
import type { ProjectDialogsController } from "@/hooks/use-project-dialogs"
import { useProjectDialogs } from "@/hooks/use-project-dialogs"
import type { ProjectDialogIntent } from "@/types/project"

interface UseProjectActionsOptions {
  /**
   * The project the workspace is currently showing, when there is one. Deleting
   * it has to leave the route as well as refresh the list.
   */
  activeProjectId?: string
}

/**
 * Turns confirmed dialog intents into real mutations.
 *
 * `useProjectDialogs` still owns every piece of dialog state; this hook only
 * fills the `onSubmit` seam it left open — the mock list is gone, the routes
 * take its place, and neither the dialogs nor the sidebar changed.
 *
 * The lists themselves are rendered from server-fetched props, so a successful
 * mutation ends in `router.refresh()` rather than local state edits.
 */
function useProjectActions(
  options: UseProjectActionsOptions = {}
): ProjectDialogsController {
  const { activeProjectId } = options
  const router = useRouter()

  const performIntent = useCallback(
    async (intent: ProjectDialogIntent) => {
      switch (intent.kind) {
        case "create": {
          const project = await createProjectRequest(intent.name)

          // The project's cuid is also its Liveblocks room ID, so the workspace
          // route is known as soon as the row exists.
          router.push(`/editor/${project.id}`)
          return
        }
        case "rename": {
          await renameProjectRequest(intent.project.id, intent.name)
          router.refresh()
          return
        }
        case "delete": {
          await deleteProjectRequest(intent.project.id)

          if (intent.project.id === activeProjectId) {
            router.push("/editor")
            return
          }

          router.refresh()
        }
      }
    },
    [activeProjectId, router]
  )

  return useProjectDialogs({ onSubmit: performIntent })
}

export { useProjectActions }
export type { UseProjectActionsOptions }

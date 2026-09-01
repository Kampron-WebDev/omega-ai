"use client"

import { CreateProjectDialog } from "@/components/editor/create-project-dialog"
import { DeleteProjectDialog } from "@/components/editor/delete-project-dialog"
import { RenameProjectDialog } from "@/components/editor/rename-project-dialog"
import type { ProjectDialogsController } from "@/hooks/use-project-dialogs"

interface ProjectDialogsProps {
  controller: ProjectDialogsController
}

/**
 * Mounts every project dialog once and drives them from a single controller, so
 * callers only need to trigger `openCreateDialog` / `openRenameDialog` /
 * `openDeleteDialog` from wherever the action lives.
 */
function ProjectDialogs({ controller }: ProjectDialogsProps) {
  const {
    openDialog,
    activeProject,
    name,
    slugPreview,
    isSubmitting,
    canSubmit,
    setName,
    closeDialog,
    submit,
  } = controller

  function handleOpenChange(open: boolean) {
    if (!open) {
      closeDialog()
    }
  }

  return (
    <>
      <CreateProjectDialog
        open={openDialog === "create"}
        name={name}
        slugPreview={slugPreview}
        isSubmitting={isSubmitting}
        canSubmit={canSubmit}
        onNameChange={setName}
        onOpenChange={handleOpenChange}
        onSubmit={submit}
      />

      <RenameProjectDialog
        open={openDialog === "rename"}
        project={activeProject}
        name={name}
        isSubmitting={isSubmitting}
        canSubmit={canSubmit}
        onNameChange={setName}
        onOpenChange={handleOpenChange}
        onSubmit={submit}
      />

      <DeleteProjectDialog
        open={openDialog === "delete"}
        project={activeProject}
        isSubmitting={isSubmitting}
        canSubmit={canSubmit}
        onOpenChange={handleOpenChange}
        onSubmit={submit}
      />
    </>
  )
}

export { ProjectDialogs }

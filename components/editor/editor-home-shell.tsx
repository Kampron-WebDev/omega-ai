"use client"

import { useState } from "react"

import { EditorHome } from "@/components/editor/editor-home"
import { EditorNavbar } from "@/components/editor/editor-navbar"
import { ProjectDialogs } from "@/components/editor/project-dialogs"
import { ProjectSidebar } from "@/components/editor/project-sidebar"
import { useProjectActions } from "@/hooks/use-project-actions"
import type { Project } from "@/types/project"

interface EditorHomeShellProps {
  ownedProjects: Project[]
  sharedProjects: Project[]
}

/**
 * The interactive half of `/editor`: sidebar visibility and the project dialogs.
 *
 * Both project lists arrive as props from the page's Server Component — nothing
 * here fetches them — so this stays a thin client boundary around state that
 * genuinely needs the browser.
 */
function EditorHomeShell({ ownedProjects, sharedProjects }: EditorHomeShellProps) {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false)
  const dialogs = useProjectActions()

  return (
    <div className="flex h-full flex-col">
      <EditorNavbar
        isSidebarOpen={isSidebarOpen}
        onToggleSidebar={() => setIsSidebarOpen((open) => !open)}
      />
      <ProjectSidebar
        isOpen={isSidebarOpen}
        onClose={() => setIsSidebarOpen(false)}
        ownedProjects={ownedProjects}
        sharedProjects={sharedProjects}
        onCreateProject={dialogs.openCreateDialog}
        onRenameProject={dialogs.openRenameDialog}
        onDeleteProject={dialogs.openDeleteDialog}
      />
      <EditorHome onCreateProject={dialogs.openCreateDialog} />
      <ProjectDialogs controller={dialogs} />
    </div>
  )
}

export { EditorHomeShell }

"use client"

import { useState } from "react"

import { EditorHome } from "@/components/editor/editor-home"
import { EditorNavbar } from "@/components/editor/editor-navbar"
import { ProjectDialogs } from "@/components/editor/project-dialogs"
import { ProjectSidebar } from "@/components/editor/project-sidebar"
import { useMockProjects } from "@/hooks/use-mock-projects"
import { useProjectDialogs } from "@/hooks/use-project-dialogs"

export default function EditorPage() {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false)
  const { ownedProjects, sharedProjects, applyIntent } = useMockProjects()
  const dialogs = useProjectDialogs({ onSubmit: applyIntent })

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

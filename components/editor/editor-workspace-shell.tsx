"use client"

import { useRef, useState } from "react"
import { LayoutTemplate, Share2, Sparkles } from "lucide-react"

import type { CanvasFlowHandle } from "@/components/editor/canvas-flow"
import { CanvasRoom } from "@/components/editor/canvas-room"
import { EditorNavbar } from "@/components/editor/editor-navbar"
import { ProjectDialogs } from "@/components/editor/project-dialogs"
import { ProjectSidebar } from "@/components/editor/project-sidebar"
import { ShareDialog } from "@/components/editor/share-dialog"
import { StarterTemplatesModal } from "@/components/editor/starter-templates-modal"
import { Button } from "@/components/ui/button"
import { useProjectActions } from "@/hooks/use-project-actions"
import type { Project } from "@/types/project"

interface EditorWorkspaceShellProps {
  project: Project
  ownedProjects: Project[]
  sharedProjects: Project[]
}

/**
 * The `/editor/[roomId]` workspace chrome: navbar, project sidebar, the
 * Liveblocks-backed canvas (`CanvasRoom`), and the AI panel slot. The AI
 * panel is still a placeholder — the chat arrives in a later chapter.
 */
function EditorWorkspaceShell({
  project,
  ownedProjects,
  sharedProjects,
}: EditorWorkspaceShellProps) {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false)
  const [isAiPanelOpen, setIsAiPanelOpen] = useState(false)
  const [isShareDialogOpen, setIsShareDialogOpen] = useState(false)
  const [isTemplatesOpen, setIsTemplatesOpen] = useState(false)
  const canvasRef = useRef<CanvasFlowHandle>(null)
  // Deleting the project being viewed has to leave the route, not just refresh.
  const dialogs = useProjectActions({ activeProjectId: project.id })

  return (
    <div className="flex h-dvh flex-col">
      <EditorNavbar
        isSidebarOpen={isSidebarOpen}
        onToggleSidebar={() => setIsSidebarOpen((open) => !open)}
        projectName={project.name}
        actions={
          <>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setIsTemplatesOpen(true)}
            >
              <LayoutTemplate />
              Templates
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setIsShareDialogOpen(true)}
            >
              <Share2 />
              Share
            </Button>
            <Button
              variant="ghost"
              size="icon-sm"
              onClick={() => setIsAiPanelOpen((open) => !open)}
              aria-pressed={isAiPanelOpen}
              aria-label={isAiPanelOpen ? "Hide AI panel" : "Show AI panel"}
            >
              <Sparkles />
            </Button>
          </>
        }
      />

      <ProjectSidebar
        isOpen={isSidebarOpen}
        onClose={() => setIsSidebarOpen(false)}
        ownedProjects={ownedProjects}
        sharedProjects={sharedProjects}
        activeProjectId={project.id}
        onCreateProject={dialogs.openCreateDialog}
        onRenameProject={dialogs.openRenameDialog}
        onDeleteProject={dialogs.openDeleteDialog}
      />

      <div className="flex min-h-0 flex-1">
        <main data-slot="canvas" className="flex-1 bg-background">
          <CanvasRoom roomId={project.id} canvasRef={canvasRef} />
        </main>

        {isAiPanelOpen ? (
          <aside
            data-slot="ai-panel-placeholder"
            aria-label="AI assistant"
            className="flex w-80 shrink-0 flex-col border-l border-border/50 bg-card"
          >
            <div className="flex h-12 shrink-0 items-center border-b border-border/50 px-3">
              <h2 className="font-heading text-sm font-medium">AI</h2>
            </div>
            <p className="flex flex-1 items-center justify-center px-6 text-center text-sm text-muted-foreground">
              The AI assistant isn&apos;t connected yet.
            </p>
          </aside>
        ) : null}
      </div>

      <ShareDialog
        open={isShareDialogOpen}
        project={project}
        onOpenChange={setIsShareDialogOpen}
      />

      <StarterTemplatesModal
        open={isTemplatesOpen}
        onOpenChange={setIsTemplatesOpen}
        onImport={(template) => canvasRef.current?.importTemplate(template)}
      />

      <ProjectDialogs controller={dialogs} />
    </div>
  )
}

export { EditorWorkspaceShell }

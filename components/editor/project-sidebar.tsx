"use client"

import { Plus, X } from "lucide-react"

import { ProjectListItem } from "@/components/editor/project-list-item"
import { Button } from "@/components/ui/button"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { cn } from "@/lib/utils"
import type { Project } from "@/types/project"

interface ProjectSidebarProps {
  isOpen: boolean
  onClose: () => void
  ownedProjects: Project[]
  sharedProjects: Project[]
  onCreateProject: () => void
  onRenameProject: (project: Project) => void
  onDeleteProject: (project: Project) => void
  className?: string
}

function ProjectSidebarEmptyState({ children }: { children: string }) {
  return (
    <p className="flex h-32 items-center justify-center text-center text-sm text-muted-foreground">
      {children}
    </p>
  )
}

function ProjectSidebar({
  isOpen,
  onClose,
  ownedProjects,
  sharedProjects,
  onCreateProject,
  onRenameProject,
  onDeleteProject,
  className,
}: ProjectSidebarProps) {
  return (
    <>
      {/*
        Mobile scrim: the sidebar overlays the canvas on small screens, so
        tapping anywhere outside it closes it. Hidden from assistive tech — the
        header's close button is the accessible path.
      */}
      <div
        data-slot="project-sidebar-scrim"
        aria-hidden="true"
        onClick={onClose}
        className={cn(
          "fixed inset-x-0 top-12 bottom-0 z-30 bg-black/60 backdrop-blur-xs transition-opacity duration-200 md:hidden",
          isOpen
            ? "pointer-events-auto opacity-100"
            : "pointer-events-none opacity-0"
        )}
      />

      <aside
        data-slot="project-sidebar"
        aria-hidden={!isOpen}
        // Keeps the closed sidebar's controls out of the tab order while it is
        // still mounted for the slide transition.
        inert={!isOpen}
        className={cn(
          "fixed top-12 bottom-0 left-0 z-40 flex w-72 -translate-x-full flex-col border-r border-border/50 bg-card shadow-xl transition-transform duration-200 ease-in-out",
          isOpen && "translate-x-0",
          className
        )}
      >
        <div className="flex h-12 shrink-0 items-center justify-between border-b border-border/50 px-3">
          <h2 className="font-heading text-sm font-medium">Projects</h2>
          <Button
            variant="ghost"
            size="icon-sm"
            onClick={onClose}
            aria-label="Close sidebar"
          >
            <X />
          </Button>
        </div>

        <Tabs
          defaultValue="my-projects"
          className="flex flex-1 flex-col overflow-hidden px-3 pt-3"
        >
          <TabsList className="w-full">
            <TabsTrigger value="my-projects" className="flex-1">
              My Projects
            </TabsTrigger>
            <TabsTrigger value="shared" className="flex-1">
              Shared
            </TabsTrigger>
          </TabsList>

          <TabsContent value="my-projects" className="flex-1 overflow-hidden">
            <ScrollArea className="h-full">
              {ownedProjects.length === 0 ? (
                <ProjectSidebarEmptyState>
                  No projects yet
                </ProjectSidebarEmptyState>
              ) : (
                <ul className="flex flex-col gap-0.5 pb-2">
                  {ownedProjects.map((project) => (
                    <ProjectListItem
                      key={project.id}
                      project={project}
                      onRename={onRenameProject}
                      onDelete={onDeleteProject}
                    />
                  ))}
                </ul>
              )}
            </ScrollArea>
          </TabsContent>

          <TabsContent value="shared" className="flex-1 overflow-hidden">
            <ScrollArea className="h-full">
              {sharedProjects.length === 0 ? (
                <ProjectSidebarEmptyState>
                  No shared projects
                </ProjectSidebarEmptyState>
              ) : (
                <ul className="flex flex-col gap-0.5 pb-2">
                  {sharedProjects.map((project) => (
                    <ProjectListItem
                      key={project.id}
                      project={project}
                      onRename={onRenameProject}
                      onDelete={onDeleteProject}
                    />
                  ))}
                </ul>
              )}
            </ScrollArea>
          </TabsContent>
        </Tabs>

        <div className="shrink-0 border-t border-border/50 p-3">
          <Button className="w-full" onClick={onCreateProject}>
            <Plus />
            New Project
          </Button>
        </div>
      </aside>
    </>
  )
}

export { ProjectSidebar }

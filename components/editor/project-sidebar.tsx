"use client"

import { Plus, X } from "lucide-react"

import { Button } from "@/components/ui/button"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { cn } from "@/lib/utils"

interface ProjectSidebarProps {
  isOpen: boolean
  onClose: () => void
  className?: string
}

function ProjectSidebar({ isOpen, onClose, className }: ProjectSidebarProps) {
  return (
    <aside
      data-slot="project-sidebar"
      aria-hidden={!isOpen}
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
            <div className="flex h-32 items-center justify-center text-center text-sm text-muted-foreground">
              No projects yet
            </div>
          </ScrollArea>
        </TabsContent>

        <TabsContent value="shared" className="flex-1 overflow-hidden">
          <ScrollArea className="h-full">
            <div className="flex h-32 items-center justify-center text-center text-sm text-muted-foreground">
              No shared projects
            </div>
          </ScrollArea>
        </TabsContent>
      </Tabs>

      <div className="shrink-0 border-t border-border/50 p-3">
        <Button className="w-full">
          <Plus />
          New Project
        </Button>
      </div>
    </aside>
  )
}

export { ProjectSidebar }

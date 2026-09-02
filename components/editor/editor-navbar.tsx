"use client"

import type { ReactNode } from "react"
import { UserButton } from "@clerk/nextjs"
import { PanelLeftClose, PanelLeftOpen } from "lucide-react"

import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"

interface EditorNavbarProps {
  isSidebarOpen: boolean
  onToggleSidebar: () => void
  /** Shown centred when a workspace is open. The home page has no project. */
  projectName?: string
  /**
   * Workspace-specific controls, rendered before the user button. A slot rather
   * than named props so the navbar stays unaware of what share or the AI
   * sidebar actually do.
   */
  actions?: ReactNode
  className?: string
}

function EditorNavbar({
  isSidebarOpen,
  onToggleSidebar,
  projectName,
  actions,
  className,
}: EditorNavbarProps) {
  return (
    <nav
      data-slot="editor-navbar"
      className={cn(
        "flex h-12 w-full shrink-0 items-center border-b border-border/50 bg-card px-3",
        className
      )}
    >
      <div className="flex flex-1 items-center gap-2">
        <Button
          variant="ghost"
          size="icon-sm"
          onClick={onToggleSidebar}
          aria-label={isSidebarOpen ? "Close sidebar" : "Open sidebar"}
        >
          {isSidebarOpen ? <PanelLeftClose /> : <PanelLeftOpen />}
        </Button>
      </div>
      <div className="flex min-w-0 flex-1 items-center justify-center px-2">
        {projectName ? (
          <span className="truncate text-sm font-medium text-foreground">
            {projectName}
          </span>
        ) : null}
      </div>
      <div className="flex flex-1 items-center justify-end gap-2">
        {actions}
        <UserButton />
      </div>
    </nav>
  )
}

export { EditorNavbar }

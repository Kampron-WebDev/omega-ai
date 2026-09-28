"use client"

import { Bot, X } from "lucide-react"

import { AiArchitectTab } from "@/components/editor/ai-architect-tab"
import { AiSpecsTab } from "@/components/editor/ai-specs-tab"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { cn } from "@/lib/utils"

interface AiSidebarProps {
  isOpen: boolean
  onClose: () => void
  className?: string
}

// The trigger ships `dark:data-active:*` styles, and the app is always dark,
// so the accent has to be restated under the same variant to win.
const tabTriggerClassName =
  "flex-1 text-copy-muted hover:text-copy-primary dark:text-copy-muted data-active:border-ai/30 data-active:bg-ai/15 data-active:text-ai-text dark:data-active:border-ai/30 dark:data-active:bg-ai/15 dark:data-active:text-ai-text"

/**
 * The floating AI panel on the right of the workspace. Open state is owned by
 * the parent; the panel stays mounted so it can slide in and out. It sits
 * below the canvas presence pill (`top-4`, 36px tall) so the user's avatar
 * menu stays reachable while it is open.
 */
function AiSidebar({ isOpen, onClose, className }: AiSidebarProps) {
  return (
    <aside
      data-slot="ai-sidebar"
      aria-label="AI workspace"
      aria-hidden={!isOpen}
      // Keeps the closed panel's controls out of the tab order while it is
      // still mounted for the slide transition.
      inert={!isOpen}
      className={cn(
        "fixed top-28 right-4 bottom-4 z-40 flex w-96 max-w-[calc(100vw-2rem)] flex-col overflow-hidden rounded-2xl border border-border-default bg-bg-base/95 shadow-2xl backdrop-blur transition-[translate,opacity] duration-200 ease-in-out",
        isOpen
          ? "translate-x-0 opacity-100"
          : "pointer-events-none translate-x-[calc(100%+1rem)] opacity-0",
        className
      )}
    >
      <header className="flex shrink-0 items-center gap-3 border-b border-border-default px-4 py-3">
        <div className="flex size-8 shrink-0 items-center justify-center rounded-xl bg-ai/15 text-ai-text">
          <Bot className="size-4" />
        </div>
        <div className="min-w-0 flex-1">
          <h2 className="font-heading text-sm font-medium text-copy-primary">
            AI Workspace
          </h2>
          <p className="truncate text-xs text-copy-muted">
            Collaborate with Ghost AI
          </p>
        </div>
        <Button
          variant="ghost"
          size="icon-sm"
          onClick={onClose}
          aria-label="Close AI workspace"
        >
          <X />
        </Button>
      </header>

      <Tabs
        defaultValue="architect"
        className="flex min-h-0 flex-1 flex-col gap-0"
      >
        <div className="shrink-0 px-4 pt-3">
          <TabsList className="w-full bg-bg-subtle">
            <TabsTrigger value="architect" className={tabTriggerClassName}>
              AI Architect
            </TabsTrigger>
            <TabsTrigger value="specs" className={tabTriggerClassName}>
              Specs
            </TabsTrigger>
          </TabsList>
        </div>

        <TabsContent value="architect" className="flex min-h-0 flex-col">
          <AiArchitectTab />
        </TabsContent>

        <TabsContent value="specs" className="min-h-0 overflow-hidden">
          <AiSpecsTab />
        </TabsContent>
      </Tabs>
    </aside>
  )
}

export { AiSidebar }

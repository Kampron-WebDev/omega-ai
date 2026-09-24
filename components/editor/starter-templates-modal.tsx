"use client"

import { Download } from "lucide-react"

import { StarterTemplatePreview } from "@/components/editor/starter-template-preview"
import {
  CANVAS_TEMPLATES,
  type CanvasTemplate,
} from "@/components/editor/starter-templates"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { ScrollArea } from "@/components/ui/scroll-area"

interface StarterTemplatesModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onImport: (template: CanvasTemplate) => void
}

function StarterTemplatesModal({
  open,
  onOpenChange,
  onImport,
}: StarterTemplatesModalProps) {
  function importTemplate(template: CanvasTemplate) {
    onImport(template)
    onOpenChange(false)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-3xl">
        <DialogHeader>
          <DialogTitle>Starter templates</DialogTitle>
          <DialogDescription>
            Start from a prebuilt diagram. Importing replaces everything on
            the current canvas.
          </DialogDescription>
        </DialogHeader>

        <ScrollArea className="max-h-[70vh]">
          <ul className="grid gap-3 pr-2 sm:grid-cols-2 lg:grid-cols-3">
            {CANVAS_TEMPLATES.map((template) => (
              <li
                key={template.id}
                className="flex flex-col gap-3 rounded-2xl border border-border/80 bg-card p-3"
              >
                <StarterTemplatePreview template={template} />
                <div className="flex flex-1 flex-col gap-1">
                  <h3 className="text-sm font-medium text-foreground">
                    {template.name}
                  </h3>
                  <p className="text-xs text-muted-foreground">
                    {template.description}
                  </p>
                </div>
                <Button
                  type="button"
                  variant="secondary"
                  size="sm"
                  onClick={() => importTemplate(template)}
                >
                  <Download />
                  Import
                </Button>
              </li>
            ))}
          </ul>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  )
}

export { StarterTemplatesModal }

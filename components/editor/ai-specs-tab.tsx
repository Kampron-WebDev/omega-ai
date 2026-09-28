import { Download, FileText, Sparkles } from "lucide-react"

import { Button } from "@/components/ui/button"
import { ScrollArea } from "@/components/ui/scroll-area"

/**
 * The specs half of the AI sidebar. Static for now: the button does nothing
 * and the card is a demo — generation, storage, and download arrive in specs
 * 35–37.
 */
function AiSpecsTab() {
  return (
    <ScrollArea className="h-full">
      <div className="flex flex-col gap-4 p-4">
        <Button className="w-full bg-ai text-white hover:bg-ai/85">
          <Sparkles />
          Generate Spec
        </Button>

        <article className="flex gap-3 rounded-2xl border border-border-default bg-bg-elevated p-3">
          <div className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-ai/15 text-ai-text">
            <FileText className="size-4" />
          </div>
          <div className="min-w-0 flex-1 space-y-1">
            <div className="flex items-start justify-between gap-2">
              <h3 className="truncate text-sm font-medium text-copy-primary">
                E-commerce Backend Spec
              </h3>
              <Button
                variant="ghost"
                size="icon-xs"
                disabled
                aria-label="Download spec"
              >
                <Download />
              </Button>
            </div>
            <p className="line-clamp-3 text-xs text-copy-muted">
              API gateway routing to catalog, cart, and order services, with
              PostgreSQL for orders, Redis for sessions, and a queue for
              payment events.
            </p>
          </div>
        </article>
      </div>
    </ScrollArea>
  )
}

export { AiSpecsTab }

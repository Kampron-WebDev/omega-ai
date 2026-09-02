import Link from "next/link"
import { Lock } from "lucide-react"

import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"

interface AccessDeniedProps {
  className?: string
}

/**
 * Shown when a workspace cannot be opened — the project does not exist, or the
 * viewer was never invited to it. Deliberately the same screen for both: which
 * one it is would tell a stranger whether a project ID is real.
 */
function AccessDenied({ className }: AccessDeniedProps) {
  return (
    <div
      data-slot="access-denied"
      className={cn(
        "flex flex-1 flex-col items-center justify-center gap-5 px-6 text-center",
        className
      )}
    >
      <div className="flex size-14 items-center justify-center rounded-2xl bg-muted">
        <Lock className="size-8 text-muted-foreground" />
      </div>

      <div className="flex max-w-md flex-col gap-2">
        <h1 className="font-heading text-xl font-medium tracking-tight text-balance">
          You don&apos;t have access to this project
        </h1>
        <p className="text-sm text-balance text-muted-foreground">
          It may have been deleted, or the owner hasn&apos;t shared it with you.
        </p>
      </div>

      <Button render={<Link href="/editor" />}>Back to projects</Button>
    </div>
  )
}

export { AccessDenied }

"use client"

import { Loader2, X } from "lucide-react"

import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import type { Collaborator } from "@/types/collaborator"

interface CollaboratorListItemProps {
  collaborator: Collaborator
  /** Owners get a remove button; collaborators get the row read-only. */
  canManage: boolean
  isRemoving: boolean
  /** True while some other row is being removed, which disables this one's button. */
  isBusy: boolean
  onRemove: (collaborator: Collaborator) => void
}

/**
 * The initials shown when Clerk has no avatar for the address — the first
 * letter of each of the first two words of a name, or the first two letters of
 * the email. Falls back to `?` for an address that starts with punctuation.
 */
function initialsFor(collaborator: Collaborator): string {
  if (collaborator.name) {
    const letters = collaborator.name
      .split(/\s+/)
      .map((word) => word.match(/\p{L}|\p{N}/u)?.[0] ?? "")
      .filter((letter) => letter !== "")
      .slice(0, 2)
      .join("")

    if (letters !== "") {
      return letters.toUpperCase()
    }
  }

  const fromEmail = collaborator.email.match(/\p{L}|\p{N}/gu)?.slice(0, 2).join("")

  return fromEmail ? fromEmail.toUpperCase() : "?"
}

function CollaboratorListItem({
  collaborator,
  canManage,
  isRemoving,
  isBusy,
  onRemove,
}: CollaboratorListItemProps) {
  // Without a Clerk name the email is the only label there is, so it becomes
  // the primary line instead of the caption under one.
  const hasName = collaborator.name !== null

  return (
    <li className="group/collaborator flex items-center gap-2.5 rounded-lg px-2 py-1.5 transition-colors hover:bg-muted/60 focus-within:bg-muted/60">
      {collaborator.imageUrl ? (
        // A plain `img`: these are arbitrary Clerk CDN URLs, and `next/image`
        // would need every possible avatar host declared in `next.config.ts`
        // to render a 28px thumbnail it cannot usefully optimize anyway.
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={collaborator.imageUrl}
          alt=""
          width={28}
          height={28}
          loading="lazy"
          decoding="async"
          className="size-7 shrink-0 rounded-full object-cover"
        />
      ) : (
        <span
          aria-hidden="true"
          className="flex size-7 shrink-0 items-center justify-center rounded-full bg-muted text-[0.6875rem] font-medium text-muted-foreground"
        >
          {initialsFor(collaborator)}
        </span>
      )}

      <div className="flex min-w-0 flex-1 flex-col">
        <span
          className={cn(
            "truncate text-sm text-foreground",
            !hasName && "text-[0.8125rem]"
          )}
        >
          {collaborator.name ?? collaborator.email}
        </span>
        {hasName ? (
          <span className="truncate text-xs text-muted-foreground">
            {collaborator.email}
          </span>
        ) : null}
      </div>

      {canManage ? (
        <Button
          variant="ghost"
          size="icon-xs"
          onClick={() => onRemove(collaborator)}
          disabled={isBusy}
          aria-label={`Remove ${collaborator.email}`}
          className="shrink-0 hover:bg-destructive/10 hover:text-destructive"
        >
          {isRemoving ? <Loader2 className="animate-spin" /> : <X />}
        </Button>
      ) : null}
    </li>
  )
}

export { CollaboratorListItem }

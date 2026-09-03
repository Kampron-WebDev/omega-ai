"use client"

import type { FormEvent } from "react"
import { Check, Link2, Loader2, UserPlus } from "lucide-react"

import { CollaboratorListItem } from "@/components/editor/collaborator-list-item"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { ScrollArea } from "@/components/ui/scroll-area"
import { useCollaborators } from "@/hooks/use-collaborators"
import { useCopyToClipboard } from "@/hooks/use-copy-to-clipboard"
import type { Project } from "@/types/project"

interface ShareDialogProps {
  open: boolean
  project: Project
  onOpenChange: (open: boolean) => void
}

const EMAIL_INPUT_ID = "share-collaborator-email"
const ACTION_ERROR_ID = "share-collaborator-error"

/**
 * Sharing for one project: invite by email, see who already has access, and
 * copy the link.
 *
 * The owner/collaborator split here is presentation only — a collaborator is
 * shown the list without any controls, while the routes independently refuse
 * their invites and removals.
 */
function ShareDialog({ open, project, onOpenChange }: ShareDialogProps) {
  const canManage = project.role === "owner"
  const collaborators = useCollaborators({ projectId: project.id, isOpen: open })
  const clipboard = useCopyToClipboard()

  // Resolved at click time rather than on mount: `location` only exists in the
  // browser, and by the time this runs the click has already proved we are there.
  function handleCopyLink() {
    clipboard.copy(`${window.location.origin}/editor/${project.id}`)
  }

  function handleInvite(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    collaborators.invite()
  }

  const errorMessage = collaborators.actionError ?? clipboard.error

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Share project</DialogTitle>
          <DialogDescription>
            {canManage
              ? `Invite people to collaborate on “${project.name}”.`
              : `Everyone with access to “${project.name}”.`}
          </DialogDescription>
        </DialogHeader>

        {canManage ? (
          <form onSubmit={handleInvite} className="flex items-start gap-2">
            <div className="flex-1">
              <label htmlFor={EMAIL_INPUT_ID} className="sr-only">
                Email address
              </label>
              <Input
                id={EMAIL_INPUT_ID}
                type="email"
                value={collaborators.email}
                onChange={(event) => collaborators.setEmail(event.target.value)}
                placeholder="teammate@company.com"
                autoComplete="off"
                spellCheck={false}
                disabled={collaborators.isInviting}
                aria-invalid={collaborators.actionError ? true : undefined}
                aria-describedby={
                  collaborators.actionError ? ACTION_ERROR_ID : undefined
                }
              />
            </div>
            <Button type="submit" disabled={!collaborators.canInvite}>
              {collaborators.isInviting ? (
                <Loader2 className="animate-spin" />
              ) : (
                <UserPlus />
              )}
              Invite
            </Button>
          </form>
        ) : null}

        <div className="flex flex-col gap-1.5">
          <h3 className="px-2 text-xs font-medium tracking-wide text-muted-foreground uppercase">
            People with access
          </h3>

          {collaborators.isLoading ? (
            <p className="flex items-center gap-2 px-2 py-6 text-sm text-muted-foreground">
              <Loader2 className="size-4 animate-spin" />
              Loading collaborators…
            </p>
          ) : collaborators.loadError ? (
            <p className="px-2 py-6 text-sm text-destructive">
              {collaborators.loadError}
            </p>
          ) : collaborators.collaborators.length === 0 ? (
            <p className="px-2 py-6 text-sm text-balance text-muted-foreground">
              {canManage
                ? "No one else has access yet. Invite someone by email above."
                : "No one else has access to this project yet."}
            </p>
          ) : (
            // Capped so a long list scrolls inside the dialog instead of
            // pushing the footer off screen.
            <ScrollArea className="max-h-56">
              <ul className="flex flex-col gap-0.5 pr-2">
                {collaborators.collaborators.map((collaborator) => (
                  <CollaboratorListItem
                    key={collaborator.id}
                    collaborator={collaborator}
                    canManage={canManage}
                    isRemoving={collaborators.removingId === collaborator.id}
                    isBusy={collaborators.removingId !== null}
                    onRemove={collaborators.remove}
                  />
                ))}
              </ul>
            </ScrollArea>
          )}
        </div>

        {errorMessage ? (
          <p id={ACTION_ERROR_ID} role="alert" className="px-2 text-sm text-destructive">
            {errorMessage}
          </p>
        ) : null}

        {/* Only the owner gets a second control, so only they need the split. */}
        <DialogFooter className={canManage ? "sm:justify-between" : undefined}>
          {canManage ? (
            <Button
              variant="outline"
              onClick={handleCopyLink}
              // The label changes under the pointer, so the confirmation has to
              // be announced rather than only seen.
              aria-live="polite"
            >
              {clipboard.isCopied ? <Check /> : <Link2 />}
              {clipboard.isCopied ? "Copied!" : "Copy link"}
            </Button>
          ) : null}

          <DialogClose render={<Button variant="outline" />}>Done</DialogClose>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

export { ShareDialog }

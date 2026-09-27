"use client"

import { useMemo, useState } from "react"
import { UserButton, useAuth } from "@clerk/nextjs"
import { shallow, useOthersMapped } from "@liveblocks/react"

import { initialsFromName } from "@/lib/initials"
import type { UserMeta } from "@/liveblocks.config"

/** Collaborators shown before the rest collapse into a `+N` chip. */
const MAX_VISIBLE_AVATARS = 5

/** Clerk's UserButton avatar, pinned to the collaborator avatars' `size-7`. */
const USER_BUTTON_APPEARANCE = {
  elements: {
    userButtonAvatarBox: { width: "1.75rem", height: "1.75rem" },
  },
}

type Collaborator = Pick<UserMeta, "id" | "info">

function PresenceAvatar({ info }: { info: UserMeta["info"] }) {
  // Tracks which URL failed, so a new avatar URL gets a fresh attempt.
  const [failedAvatar, setFailedAvatar] = useState<string | null>(null)
  const showImage = info.avatar !== "" && failedAvatar !== info.avatar

  return (
    <span
      role="img"
      aria-label={info.name}
      className="flex size-7 shrink-0 items-center justify-center overflow-hidden rounded-full bg-muted text-[0.6875rem] font-medium text-muted-foreground ring-2 ring-card"
    >
      {showImage ? (
        // A plain `img` for the same reason as `CollaboratorListItem`: Clerk
        // avatar hosts are not declared for `next/image`.
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={info.avatar}
          alt=""
          width={28}
          height={28}
          decoding="async"
          className="size-full object-cover"
          onError={() => setFailedAvatar(info.avatar)}
        />
      ) : (
        (initialsFromName(info.name) ?? "?")
      )}
    </span>
  )
}

/**
 * The top-right participant group of the canvas: other people in the room as
 * a display-only avatar stack, then the current user as Clerk's UserButton.
 *
 * Lives under `RoomProvider` but outside the canvas's suspense boundary, so
 * the UserButton is reachable while the room is still connecting or has
 * failed — `useOthersMapped` simply reports nobody until it connects.
 */
function CanvasPresence() {
  const { userId } = useAuth()
  // Mapped per connection with `shallow`, so cursor movement — which changes
  // presence, not `id` or `info` — does not re-render the stack.
  const others = useOthersMapped(
    (other): Collaborator => ({ id: other.id, info: other.info }),
    shallow
  )
  const collaborators = useMemo(() => {
    const byUserId = new Map<string, Collaborator>()

    // One avatar per person: the current user's other tabs are dropped, and a
    // collaborator with several tabs open appears once.
    for (const [, collaborator] of others) {
      if (collaborator.id !== userId && !byUserId.has(collaborator.id)) {
        byUserId.set(collaborator.id, collaborator)
      }
    }

    return [...byUserId.values()]
  }, [others, userId])
  const visible = collaborators.slice(0, MAX_VISIBLE_AVATARS)
  const overflow = collaborators.length - visible.length

  return (
    <div
      data-slot="canvas-presence"
      className="absolute top-4 right-4 z-10 flex items-center gap-2 rounded-full border border-border/80 bg-card/95 p-1 shadow-lg backdrop-blur"
    >
      {collaborators.length > 0 ? (
        <>
          <ul
            aria-label={`${collaborators.length} ${collaborators.length === 1 ? "collaborator" : "collaborators"} in this canvas`}
            className="flex items-center -space-x-2"
          >
            {visible.map(({ id, info }) => (
              <li key={id} className="flex">
                <PresenceAvatar info={info} />
              </li>
            ))}
            {overflow > 0 ? (
              <li
                aria-label={`${overflow} more`}
                className="flex size-7 shrink-0 items-center justify-center rounded-full bg-muted text-[0.6875rem] font-medium text-muted-foreground ring-2 ring-card"
              >
                +{overflow}
              </li>
            ) : null}
          </ul>
          <div aria-hidden="true" className="h-5 w-px bg-border" />
        </>
      ) : null}
      <div className="flex size-7 items-center justify-center">
        <UserButton appearance={USER_BUTTON_APPEARANCE} />
      </div>
    </div>
  )
}

export { CanvasPresence }

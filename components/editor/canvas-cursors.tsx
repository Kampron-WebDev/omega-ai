"use client"

import { useAuth } from "@clerk/nextjs"
import { useOthers } from "@liveblocks/react"
import { useStore, ViewportPortal } from "@xyflow/react"

/**
 * Other participants' live cursors, drawn in flow coordinates so each one
 * lands on the same spot of the diagram whatever the local pan and zoom.
 *
 * Filtered by Clerk user ID as well as connection: `useOthers` already omits
 * this tab, but the same account open in a second tab is still the current
 * user, not a collaborator.
 */
function CanvasCursors() {
  const { userId } = useAuth()
  const others = useOthers()
  // Cursors sit inside the zoomed viewport; scaling by the inverse keeps the
  // pointer and badge a constant on-screen size.
  const scale = useStore((state) => 1 / state.transform[2])

  return (
    <ViewportPortal>
      {others.map(({ connectionId, id, info, presence }) =>
        presence.cursor && id !== userId ? (
          <div
            key={connectionId}
            aria-hidden="true"
            className="pointer-events-none absolute top-0 left-0 z-[2000]"
            style={{
              transform: `translate(${presence.cursor.x}px, ${presence.cursor.y}px) scale(${scale})`,
              transformOrigin: "0 0",
            }}
          >
            <svg
              width="16"
              height="20"
              viewBox="0 0 16 20"
              fill={info.color}
              className="stroke-background drop-shadow-sm"
              strokeWidth="1.25"
              strokeLinejoin="round"
            >
              <path d="M1 1v15.5l4.2-4 2.9 6.3 2.6-1.2-2.9-6.2H14z" />
            </svg>
            <span
              className="absolute top-4 left-3 max-w-40 truncate rounded-full px-2 py-0.5 text-xs font-medium whitespace-nowrap text-background shadow-sm"
              style={{ backgroundColor: info.color }}
            >
              {info.name}
            </span>
          </div>
        ) : null
      )}
    </ViewportPortal>
  )
}

export { CanvasCursors }

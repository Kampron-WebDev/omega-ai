"use client"

import { ClientSideSuspense, LiveblocksProvider, RoomProvider } from "@liveblocks/react"

import { CanvasErrorBoundary } from "@/components/editor/canvas-error-boundary"
import { CanvasFlow } from "@/components/editor/canvas-flow"

interface CanvasRoomProps {
  /** The project's cuid — see the room-ID decision in `progress-tracker.md`. */
  roomId: string
}

/**
 * The client-side Liveblocks room boundary for one project's canvas.
 * `LiveblocksProvider` posts `{ room }` to `/api/liveblocks-auth` (the string
 * form of `authEndpoint`) whenever a client under it connects to a room.
 */
function CanvasRoom({ roomId }: CanvasRoomProps) {
  return (
    <LiveblocksProvider authEndpoint="/api/liveblocks-auth">
      <RoomProvider id={roomId} initialPresence={{ cursor: null, thinking: false }}>
        <CanvasErrorBoundary>
          <ClientSideSuspense
            fallback={
              <div className="flex h-full items-center justify-center bg-background">
                <p className="text-sm text-muted-foreground">
                  Connecting to the canvas…
                </p>
              </div>
            }
          >
            <CanvasFlow />
          </ClientSideSuspense>
        </CanvasErrorBoundary>
      </RoomProvider>
    </LiveblocksProvider>
  )
}

export { CanvasRoom }

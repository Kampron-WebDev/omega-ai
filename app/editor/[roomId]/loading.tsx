/**
 * Shown while `/editor/[roomId]` runs its access check and loads the project
 * lists. It mirrors the workspace's frame (a navbar-height bar over the canvas
 * area) so the page does not jump when the real workspace streams in.
 */
export default function WorkspaceLoading() {
  return (
    <div className="flex h-dvh flex-col" aria-busy="true">
      <div className="flex h-12 shrink-0 items-center gap-3 border-b border-border/50 bg-card px-3">
        <div className="size-7 rounded-lg bg-bg-subtle" />
        <div className="h-4 w-40 rounded-md bg-bg-subtle" />
      </div>

      <div className="relative flex-1 overflow-hidden bg-background">
        <div className="absolute top-[22%] left-[18%] h-24 w-44 animate-pulse rounded-2xl bg-bg-surface" />
        <div className="absolute top-[30%] left-[48%] h-24 w-44 animate-pulse rounded-2xl bg-bg-surface" />
        <div className="absolute top-[56%] left-[32%] h-28 w-40 animate-pulse rounded-2xl bg-bg-surface" />
        <div className="absolute bottom-4 left-1/2 h-12 w-80 -translate-x-1/2 animate-pulse rounded-2xl bg-bg-surface" />
      </div>

      <p role="status" className="sr-only">
        Loading workspace…
      </p>
    </div>
  )
}

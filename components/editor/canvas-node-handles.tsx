import { Handle, Position } from "@xyflow/react"

import { cn } from "@/lib/utils"

const HANDLE_POSITIONS = [
  Position.Top,
  Position.Right,
  Position.Bottom,
  Position.Left,
] as const

interface CanvasNodeHandlesProps {
  isVisible: boolean
}

/**
 * One connection handle per node side. Every handle is a `source`: the canvas
 * runs in `ConnectionMode.Loose`, which lets a source connect to a source, so
 * any side can start or end an edge without doubling up target handles.
 *
 * Hidden at rest and faded in while the enclosing `group/node` is hovered, or
 * whenever `isVisible` pins them on.
 */
function CanvasNodeHandles({ isVisible }: CanvasNodeHandlesProps) {
  return HANDLE_POSITIONS.map((position) => (
    <Handle
      key={position}
      id={position}
      type="source"
      position={position}
      className={cn(
        "!h-2 !w-2 !min-h-0 !min-w-0 !rounded-full !border !border-bg-base !bg-copy-primary transition-opacity duration-150 group-hover/node:opacity-100",
        isVisible ? "opacity-100" : "opacity-0"
      )}
    />
  ))
}

export { CanvasNodeHandles }

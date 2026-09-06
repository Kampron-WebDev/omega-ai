"use client"

import type { NodeProps } from "@xyflow/react"

import { cn } from "@/lib/utils"
import { NODE_COLORS, type CanvasNode } from "@/types/canvas"

function CanvasNodeRenderer({ data, selected }: NodeProps<CanvasNode>) {
  const color =
    NODE_COLORS.find((nodeColor) => nodeColor.id === data.color) ??
    NODE_COLORS[0]

  return (
    <div
      className={cn(
        "flex h-full w-full items-center justify-center overflow-hidden rounded-xl border px-4 text-center text-sm shadow-sm",
        selected ? "border-brand" : "border-border-subtle"
      )}
      style={{ backgroundColor: color.fill, color: color.text }}
    >
      {data.label}
    </div>
  )
}

export { CanvasNodeRenderer }

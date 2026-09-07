import type { CSSProperties, ReactNode } from "react"

import { cn } from "@/lib/utils"
import type { NodeShapeId } from "@/types/canvas"

interface CanvasNodeShapeProps {
  shape: NodeShapeId
  fill: string
  textColor: string
  selected?: boolean
  label?: ReactNode
  labelClassName?: string
  className?: string
}

function CanvasNodeSvg({
  shape,
  fill,
  stroke,
}: Pick<CanvasNodeShapeProps, "shape" | "fill"> & { stroke: string }) {
  const sharedProps = {
    fill,
    stroke,
    strokeWidth: 1.5,
    vectorEffect: "non-scaling-stroke" as const,
  }

  if (shape === "diamond") {
    return <polygon points="50,1 99,50 50,99 1,50" {...sharedProps} />
  }

  if (shape === "hexagon") {
    return <polygon points="25,1 75,1 99,50 75,99 25,99 1,50" {...sharedProps} />
  }

  return (
    <>
      <path
        d="M 5,18 C 5,8 95,8 95,18 V 82 C 95,92 5,92 5,82 Z"
        {...sharedProps}
      />
      <path
        d="M 5,18 C 5,28 95,28 95,18"
        fill="none"
        stroke={stroke}
        strokeWidth={1.5}
        vectorEffect="non-scaling-stroke"
      />
    </>
  )
}

/**
 * The visual layer shared by persisted canvas nodes and the transient drag
 * preview. Keeping both paths here means a dropped node always matches the
 * shape users saw while dragging it.
 */
function CanvasNodeShape({
  shape,
  fill,
  textColor,
  selected = false,
  label,
  labelClassName,
  className,
}: CanvasNodeShapeProps) {
  const borderColor = selected
    ? "var(--accent-primary)"
    : "var(--border-subtle)"
  const isSvgShape =
    shape === "diamond" || shape === "hexagon" || shape === "cylinder"
  const surfaceClassName = cn(
    "absolute inset-0 shadow-sm",
    shape === "rectangle" && "rounded-xl border",
    (shape === "pill" || shape === "circle") && "rounded-full border"
  )
  const surfaceStyle: CSSProperties = {
    backgroundColor: fill,
    borderColor,
  }

  return (
    <div
      className={cn(
        "relative flex h-full w-full items-center justify-center overflow-hidden text-center text-sm",
        className
      )}
      style={{ color: textColor }}
    >
      {isSvgShape ? (
        <svg
          aria-hidden="true"
          className="absolute inset-0 h-full w-full overflow-visible drop-shadow-sm"
          viewBox="0 0 100 100"
          preserveAspectRatio="none"
        >
          <CanvasNodeSvg shape={shape} fill={fill} stroke={borderColor} />
        </svg>
      ) : (
        <div aria-hidden="true" className={surfaceClassName} style={surfaceStyle} />
      )}

      {label ? (
        <span
          className={cn(
            "relative z-10",
            labelClassName ?? "line-clamp-3 px-4",
            shape === "diamond" && "w-3/5 px-0",
            shape === "hexagon" && "w-3/4 px-0"
          )}
        >
          {label}
        </span>
      ) : null}
    </div>
  )
}

export { CanvasNodeShape }

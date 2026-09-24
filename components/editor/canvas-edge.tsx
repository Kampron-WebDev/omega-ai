"use client"

import {
  useEffect,
  useRef,
  useState,
  type KeyboardEvent,
  type MouseEvent,
} from "react"
import {
  BaseEdge,
  EdgeLabelRenderer,
  getSmoothStepPath,
  type EdgeProps,
} from "@xyflow/react"

import { cn } from "@/lib/utils"
import { EDGE_COLOR, type CanvasEdge } from "@/types/canvas"

const EDGE_STROKE_WIDTH = 1.5
/** Invisible hit area around the line, so a thin edge stays easy to grab. */
const EDGE_INTERACTION_WIDTH = 24
const EDGE_CORNER_RADIUS = 8

interface CanvasEdgeRendererProps extends EdgeProps<CanvasEdge> {
  onLabelChange: (edgeId: string, label: string) => void
}

function CanvasEdgeRenderer({
  id,
  data,
  selected,
  markerEnd,
  sourceX,
  sourceY,
  sourcePosition,
  targetX,
  targetY,
  targetPosition,
  onLabelChange,
}: CanvasEdgeRendererProps) {
  const label = data?.label ?? ""
  const [isHovered, setIsHovered] = useState(false)
  const [isEditing, setIsEditing] = useState(false)
  const [draftLabel, setDraftLabel] = useState("")
  const inputRef = useRef<HTMLInputElement>(null)
  const [edgePath, labelX, labelY] = getSmoothStepPath({
    sourceX,
    sourceY,
    sourcePosition,
    targetX,
    targetY,
    targetPosition,
    borderRadius: EDGE_CORNER_RADIUS,
  })
  const isActive = isHovered || Boolean(selected) || isEditing

  useEffect(() => {
    if (isEditing) {
      inputRef.current?.select()
    }
  }, [isEditing])

  function startEditing(event: MouseEvent) {
    event.preventDefault()
    event.stopPropagation()
    setDraftLabel(label)
    setIsEditing(true)
  }

  function finishEditing() {
    if (!isEditing) {
      return
    }

    setIsEditing(false)

    const nextLabel = draftLabel.trim()

    if (nextLabel !== label) {
      onLabelChange(id, nextLabel)
    }
  }

  function handleEditorKeyDown(event: KeyboardEvent<HTMLInputElement>) {
    // Keeps Backspace/Delete from reaching React Flow's delete-selection key.
    event.stopPropagation()

    if (event.key === "Enter" || event.key === "Escape") {
      event.preventDefault()
      finishEditing()
    }
  }

  return (
    <>
      {/* `nopan` keeps d3-zoom from treating a double-click here as zoom-in. */}
      <g
        className="nopan"
        style={{
          opacity: isActive ? 1 : 0.55,
          transition: "opacity 150ms ease",
        }}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
        onDoubleClick={startEditing}
      >
        <BaseEdge
          id={id}
          path={edgePath}
          markerEnd={markerEnd}
          interactionWidth={EDGE_INTERACTION_WIDTH}
          style={{
            stroke: EDGE_COLOR,
            strokeWidth: EDGE_STROKE_WIDTH,
            strokeLinecap: "round",
            strokeLinejoin: "round",
          }}
        />
      </g>
      <EdgeLabelRenderer>
        <div
          className="nodrag nopan absolute"
          style={{
            transform: `translate(-50%, -50%) translate(${labelX}px, ${labelY}px)`,
          }}
          onMouseEnter={() => setIsHovered(true)}
          onMouseLeave={() => setIsHovered(false)}
          onPointerDown={(event) => event.stopPropagation()}
        >
          {isEditing ? (
            // The hidden twin sizes the grid cell, so the input grows with its text.
            <span className="pointer-events-auto inline-grid rounded-full border border-brand bg-bg-elevated px-2 py-0.5 text-xs leading-4 text-copy-primary">
              <span
                aria-hidden="true"
                className="invisible col-start-1 row-start-1 whitespace-pre"
              >
                {draftLabel || "Add label"}
              </span>
              <input
                ref={inputRef}
                value={draftLabel}
                placeholder="Add label"
                aria-label="Edit edge label"
                size={1}
                className="col-start-1 row-start-1 w-full min-w-0 bg-transparent outline-none placeholder:text-copy-muted"
                onChange={(event) => setDraftLabel(event.target.value)}
                onBlur={finishEditing}
                onKeyDown={handleEditorKeyDown}
              />
            </span>
          ) : label ? (
            <span
              className="pointer-events-auto block cursor-text whitespace-pre rounded-full border border-border-default bg-bg-elevated px-2 py-0.5 text-xs leading-4 text-copy-secondary"
              onDoubleClick={startEditing}
            >
              {label}
            </span>
          ) : (
            // Stays mounted and only fades, so moving the pointer from the
            // line onto the hint never unmounts it mid-hover.
            <span
              className={cn(
                "block cursor-text whitespace-pre px-2 py-0.5 text-xs leading-4 text-copy-faint transition-opacity duration-150",
                isActive ? "pointer-events-auto opacity-100" : "opacity-0"
              )}
              onDoubleClick={startEditing}
            >
              Double-click to label
            </span>
          )}
        </div>
      </EdgeLabelRenderer>
    </>
  )
}

export { CanvasEdgeRenderer }

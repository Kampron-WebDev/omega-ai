"use client"

import type { DragEvent } from "react"
import {
  Circle,
  Database,
  Diamond,
  Hexagon,
  Pill,
  RectangleHorizontal,
  type LucideIcon,
} from "lucide-react"
import { Panel } from "@xyflow/react"

import { Button } from "@/components/ui/button"
import {
  CANVAS_SHAPE_DRAG_TYPE,
  serializeCanvasShapeDragPayload,
} from "@/lib/canvas-drag"
import { NODE_SHAPES, type NodeShapeId } from "@/types/canvas"

const SHAPE_ICONS: Record<NodeShapeId, LucideIcon> = {
  rectangle: RectangleHorizontal,
  diamond: Diamond,
  circle: Circle,
  pill: Pill,
  cylinder: Database,
  hexagon: Hexagon,
}

function startShapeDrag(
  event: DragEvent<HTMLButtonElement>,
  shape: NodeShapeId
) {
  event.dataTransfer.effectAllowed = "copy"
  event.dataTransfer.setData(
    CANVAS_SHAPE_DRAG_TYPE,
    serializeCanvasShapeDragPayload(shape)
  )
}

function CanvasShapePanel() {
  return (
    <Panel position="bottom-center" className="m-4">
      <div
        role="toolbar"
        aria-label="Add a shape"
        className="nopan flex items-center gap-1 rounded-3xl border border-border/80 bg-card/95 p-1.5 shadow-lg backdrop-blur"
      >
        {NODE_SHAPES.map((shape) => {
          const Icon = SHAPE_ICONS[shape]

          return (
            <Button
              key={shape}
              type="button"
              draggable
              variant="ghost"
              size="icon-lg"
              className="cursor-grab text-muted-foreground capitalize active:cursor-grabbing"
              aria-label={`Drag ${shape} onto canvas`}
              title={shape}
              onDragStart={(event) => startShapeDrag(event, shape)}
            >
              <Icon />
            </Button>
          )
        })}
      </div>
    </Panel>
  )
}

export { CanvasShapePanel }

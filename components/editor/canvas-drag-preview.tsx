import { CanvasNodeShape } from "@/components/editor/canvas-node-shape"
import { NODE_COLORS } from "@/types/canvas"
import type { CanvasShapeDragPayload } from "@/lib/canvas-drag"

interface CanvasDragPreviewProps {
  payload: CanvasShapeDragPayload
  position: { x: number; y: number }
}

function CanvasDragPreview({ payload, position }: CanvasDragPreviewProps) {
  const color = NODE_COLORS[0]

  return (
    <div
      aria-hidden="true"
      className="pointer-events-none fixed left-0 top-0 z-50 opacity-70"
      style={{
        width: payload.width,
        height: payload.height,
        transform: `translate3d(${position.x + 12}px, ${position.y + 12}px, 0)`,
      }}
    >
      <CanvasNodeShape
        shape={payload.shape}
        fill={color.fill}
        textColor={color.text}
      />
    </div>
  )
}

export { CanvasDragPreview }

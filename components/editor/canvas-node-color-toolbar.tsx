import type { CSSProperties, PointerEvent } from "react"
import { NodeToolbar } from "@xyflow/react"

import { cn } from "@/lib/utils"
import { NODE_COLORS, type NodeColorId } from "@/types/canvas"

interface CanvasNodeColorToolbarProps {
  activeColor: NodeColorId
  isVisible: boolean
  onColorChange: (color: NodeColorId) => void
}

interface ColorSwatchStyle extends CSSProperties {
  "--swatch-glow": string
}

function CanvasNodeColorToolbar({
  activeColor,
  isVisible,
  onColorChange,
}: CanvasNodeColorToolbarProps) {
  return (
    <NodeToolbar isVisible={isVisible} offset={12} className="nodrag nopan">
      <div
        role="toolbar"
        aria-label="Node color"
        className="flex items-center gap-1 rounded-xl border border-border-subtle bg-bg-elevated/95 p-1 shadow-lg backdrop-blur"
        onPointerDown={(event) => event.stopPropagation()}
      >
        {NODE_COLORS.map((color) => {
          const isActive = color.id === activeColor
          const swatchStyle: ColorSwatchStyle = {
            backgroundColor: color.fill,
            borderColor: color.text,
            "--swatch-glow": color.text,
          }

          return (
            <button
              key={color.id}
              type="button"
              aria-label={`Use ${color.id} node color`}
              aria-pressed={isActive}
              title={color.id}
              className={cn(
                "h-4 w-4 rounded-full border transition-[box-shadow,transform] hover:scale-110 hover:shadow-[0_0_8px_var(--swatch-glow)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand focus-visible:ring-offset-2 focus-visible:ring-offset-bg-elevated",
                isActive && "scale-110 ring-2 ring-brand ring-offset-2 ring-offset-bg-elevated"
              )}
              style={swatchStyle}
              onClick={() => onColorChange(color.id)}
              onPointerDown={(event: PointerEvent<HTMLButtonElement>) =>
                event.stopPropagation()
              }
            />
          )
        })}
      </div>
    </NodeToolbar>
  )
}

export { CanvasNodeColorToolbar }

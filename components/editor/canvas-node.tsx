"use client"

import { useEffect, useRef, useState, type KeyboardEvent, type MouseEvent } from "react"
import { NodeResizer, type NodeProps } from "@xyflow/react"

import { CanvasNodeColorToolbar } from "@/components/editor/canvas-node-color-toolbar"
import { CanvasNodeShape } from "@/components/editor/canvas-node-shape"
import { Textarea } from "@/components/ui/textarea"
import { cn } from "@/lib/utils"
import { NODE_COLORS, type CanvasNode } from "@/types/canvas"

const MIN_NODE_WIDTH = 96
const MIN_NODE_HEIGHT = 56

interface CanvasNodeRendererProps extends NodeProps<CanvasNode> {
  onLabelChange: (nodeId: string, label: string) => void
  onColorChange: (nodeId: string, color: CanvasNode["data"]["color"]) => void
}

function CanvasNodeRenderer({
  id,
  data,
  selected,
  onLabelChange,
  onColorChange,
}: CanvasNodeRendererProps) {
  const color =
    NODE_COLORS.find((nodeColor) => nodeColor.id === data.color) ??
    NODE_COLORS[0]
  const [isEditing, setIsEditing] = useState(false)
  const [draftLabel, setDraftLabel] = useState("")
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  useEffect(() => {
    if (isEditing) {
      textareaRef.current?.focus()
    }
  }, [isEditing])

  function startEditing(event: MouseEvent<HTMLSpanElement>) {
    event.preventDefault()
    event.stopPropagation()
    setDraftLabel(data.label)
    setIsEditing(true)
  }

  function updateLabel(label: string) {
    setDraftLabel(label)
    onLabelChange(id, label)
  }

  function finishEditing() {
    setIsEditing(false)
  }

  function handleEditorKeyDown(event: KeyboardEvent<HTMLTextAreaElement>) {
    event.stopPropagation()

    if (event.key === "Escape") {
      event.preventDefault()
      finishEditing()
    }
  }

  return (
    <>
      <CanvasNodeColorToolbar
        activeColor={data.color}
        isVisible={selected}
        onColorChange={(color) => onColorChange(id, color)}
      />
      <NodeResizer
        isVisible={selected}
        minWidth={MIN_NODE_WIDTH}
        minHeight={MIN_NODE_HEIGHT}
        handleClassName="!h-2 !w-2 !rounded-full"
        handleStyle={{
          backgroundColor: "var(--bg-elevated)",
          borderColor: "var(--accent-primary)",
        }}
        lineStyle={{ borderColor: "var(--accent-primary)", opacity: 0.65 }}
      />
      <CanvasNodeShape
        shape={data.shape}
        fill={color.fill}
        textColor={color.text}
        selected={selected}
        labelClassName={isEditing ? "h-full w-full px-3 py-2" : undefined}
        label={
          isEditing ? (
            <Textarea
              ref={textareaRef}
              value={draftLabel}
              placeholder="Add label"
              aria-label="Edit node label"
              className="nodrag nopan !h-full !min-h-0 !resize-none !rounded-xl !border-border-subtle !bg-bg-elevated/95 !px-2 !py-1.5 !text-center !text-sm !leading-5 !text-copy-primary placeholder:!text-copy-muted focus-visible:!border-brand"
              onChange={(event) => updateLabel(event.target.value)}
              onBlur={finishEditing}
              onKeyDown={handleEditorKeyDown}
              onPointerDown={(event) => event.stopPropagation()}
            />
          ) : (
            <span
              className={cn(
                "nodrag cursor-text",
                !data.label && "text-copy-muted"
              )}
              onDoubleClick={startEditing}
            >
              {data.label || "Add label"}
            </span>
          )
        }
      />
    </>
  )
}

export { CanvasNodeRenderer }

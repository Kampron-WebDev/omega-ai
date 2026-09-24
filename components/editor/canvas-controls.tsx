"use client"

import type { ReactNode } from "react"
import { Maximize, Redo2, Undo2, ZoomIn, ZoomOut } from "lucide-react"
import { Panel } from "@xyflow/react"

import { Button } from "@/components/ui/button"

interface CanvasControlsProps {
  onZoomIn: () => void
  onZoomOut: () => void
  onFitView: () => void
  onUndo: () => void
  onRedo: () => void
  canUndo: boolean
  canRedo: boolean
}

interface ControlButtonProps {
  label: string
  onClick: () => void
  disabled?: boolean
  children: ReactNode
}

function ControlButton({ label, onClick, disabled, children }: ControlButtonProps) {
  return (
    <Button
      type="button"
      variant="ghost"
      size="icon"
      className="rounded-full text-muted-foreground hover:text-foreground"
      aria-label={label}
      title={label}
      disabled={disabled}
      onClick={onClick}
    >
      {children}
    </Button>
  )
}

/**
 * The bottom-left viewport and history bar. Purely presentational: the flow
 * owns the React Flow instance and Liveblocks history, and hands the actions
 * down so the keyboard shortcuts can share them.
 */
function CanvasControls({
  onZoomIn,
  onZoomOut,
  onFitView,
  onUndo,
  onRedo,
  canUndo,
  canRedo,
}: CanvasControlsProps) {
  return (
    <Panel position="bottom-left" className="z-10 m-4">
      <div
        role="toolbar"
        aria-label="Canvas controls"
        className="nopan flex items-center gap-0.5 rounded-full border border-border/80 bg-card/95 p-1 shadow-lg backdrop-blur"
      >
        <ControlButton label="Zoom out" onClick={onZoomOut}>
          <ZoomOut />
        </ControlButton>
        <ControlButton label="Fit view" onClick={onFitView}>
          <Maximize />
        </ControlButton>
        <ControlButton label="Zoom in" onClick={onZoomIn}>
          <ZoomIn />
        </ControlButton>
        <div aria-hidden="true" className="mx-1 h-5 w-px bg-border" />
        <ControlButton label="Undo" onClick={onUndo} disabled={!canUndo}>
          <Undo2 />
        </ControlButton>
        <ControlButton label="Redo" onClick={onRedo} disabled={!canRedo}>
          <Redo2 />
        </ControlButton>
      </div>
    </Panel>
  )
}

export { CanvasControls }

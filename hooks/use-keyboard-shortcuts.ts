"use client"

import { useEffect } from "react"
import type { ReactFlowInstance } from "@xyflow/react"

import type { CanvasEdge, CanvasNode } from "@/types/canvas"

/** Shared with the control bar so keys and buttons move the viewport alike. */
const CANVAS_ZOOM_DURATION_MS = 200

interface UseKeyboardShortcutsOptions {
  /** `null` until React Flow's `onInit` fires; zoom keys no-op until then. */
  flowInstance: ReactFlowInstance<CanvasNode, CanvasEdge> | null
  undo: () => void
  redo: () => void
}

function isEditableTarget(target: EventTarget | null): boolean {
  if (!(target instanceof HTMLElement)) {
    return false
  }

  return (
    target.isContentEditable ||
    target instanceof HTMLInputElement ||
    target instanceof HTMLTextAreaElement ||
    target instanceof HTMLSelectElement
  )
}

/**
 * Canvas keyboard shortcuts, listened for on `window` so they work wherever
 * focus sits on the page — except inside an editable field, where the keys
 * belong to the text (a node or edge label's own undo, a typed `-`).
 *
 * Zoom keys ignore Cmd/Ctrl so the browser's own page zoom keeps working.
 */
function useKeyboardShortcuts({
  flowInstance,
  undo,
  redo,
}: UseKeyboardShortcutsOptions) {
  useEffect(() => {
    function handleKeyDown(event: KeyboardEvent) {
      if (event.defaultPrevented || isEditableTarget(event.target)) {
        return
      }

      const key = event.key.toLowerCase()
      const hasModifier = event.metaKey || event.ctrlKey

      if (hasModifier && !event.altKey) {
        if (key === "z") {
          event.preventDefault()

          if (event.shiftKey) {
            redo()
          } else {
            undo()
          }
        } else if (key === "y" && !event.shiftKey) {
          event.preventDefault()
          redo()
        }

        return
      }

      if (event.altKey || !flowInstance) {
        return
      }

      if (key === "+" || key === "=") {
        event.preventDefault()
        void flowInstance.zoomIn({ duration: CANVAS_ZOOM_DURATION_MS })
      } else if (key === "-") {
        event.preventDefault()
        void flowInstance.zoomOut({ duration: CANVAS_ZOOM_DURATION_MS })
      }
    }

    window.addEventListener("keydown", handleKeyDown)

    return () => window.removeEventListener("keydown", handleKeyDown)
  }, [flowInstance, undo, redo])
}

export { CANVAS_ZOOM_DURATION_MS, useKeyboardShortcuts }

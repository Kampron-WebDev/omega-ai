"use client"

import { Component, type ReactNode } from "react"

interface CanvasErrorBoundaryProps {
  children: ReactNode
}

interface CanvasErrorBoundaryState {
  hasError: boolean
}

/**
 * `ClientSideSuspense` only catches the loading promise, not a rejected one —
 * a failed `/api/liveblocks-auth` call or a dropped room connection surfaces
 * as a thrown error, which needs an actual error boundary above the Suspense
 * boundary to catch. No `react-error-boundary` package is installed, and this
 * needs nothing beyond React's own `componentDidCatch` mechanism.
 */
class CanvasErrorBoundary extends Component<
  CanvasErrorBoundaryProps,
  CanvasErrorBoundaryState
> {
  state: CanvasErrorBoundaryState = { hasError: false }

  static getDerivedStateFromError(): CanvasErrorBoundaryState {
    return { hasError: true }
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="flex h-full items-center justify-center bg-background px-6 text-center">
          <p className="max-w-sm text-sm text-balance text-muted-foreground">
            The canvas couldn&apos;t connect. Refresh the page to try again.
          </p>
        </div>
      )
    }

    return this.props.children
  }
}

export { CanvasErrorBoundary }

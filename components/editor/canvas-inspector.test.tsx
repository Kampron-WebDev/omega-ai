// @vitest-environment jsdom
import { cleanup, fireEvent, render, screen } from "@testing-library/react"
import { afterEach, describe, expect, it, vi } from "vitest"

import { CanvasInspector } from "@/components/editor/canvas-inspector"
import { CANVAS_LIMITS } from "@/lib/canvas-schema"
import type { CanvasEdge, CanvasNode } from "@/types/canvas"

const node: CanvasNode = {
  id: "orders",
  type: "canvasNode",
  position: { x: 0, y: 0 },
  data: {
    label: "Orders",
    color: "neutral",
    shape: "rectangle",
    kind: "database",
    technology: "PostgreSQL 16",
  },
}

const edge: CanvasEdge = {
  id: "e1",
  type: "canvasEdge",
  source: "api",
  target: "orders",
  data: { label: "writes", protocol: "sql" },
}

function renderNode(overrides: Partial<CanvasNode["data"]> = {}) {
  const onNodeChange = vi.fn()
  const onClose = vi.fn()

  render(
    <CanvasInspector
      element={{ type: "node", node: { ...node, data: { ...node.data, ...overrides } } }}
      onNodeChange={onNodeChange}
      onEdgeChange={vi.fn()}
      onClose={onClose}
    />
  )

  return { onNodeChange, onClose }
}

function renderEdge(data: CanvasEdge["data"] = edge.data) {
  const onEdgeChange = vi.fn()

  render(
    <CanvasInspector
      element={{
        type: "edge",
        edge: { ...edge, data },
        sourceLabel: "API",
        targetLabel: "Orders",
      }}
      onNodeChange={vi.fn()}
      onEdgeChange={onEdgeChange}
      onClose={vi.fn()}
    />
  )

  return { onEdgeChange }
}

afterEach(cleanup)

describe("CanvasInspector", () => {
  it("enforces the schema limits on every node text field", () => {
    renderNode()

    expect(screen.getByLabelText<HTMLInputElement>("Label").maxLength).toBe(
      CANVAS_LIMITS.maxLabel
    )
    expect(
      screen.getByLabelText<HTMLInputElement>("Technology").maxLength
    ).toBe(CANVAS_LIMITS.maxTechnology)
    expect(
      screen.getByLabelText<HTMLTextAreaElement>("Description").maxLength
    ).toBe(CANVAS_LIMITS.maxDescription)
  })

  it("enforces the edge label limit", () => {
    renderEdge()

    expect(screen.getByLabelText<HTMLInputElement>("Label").maxLength).toBe(
      CANVAS_LIMITS.maxEdgeLabel
    )
  })

  it("writes a label through the node callback on blur", () => {
    const { onNodeChange } = renderNode()
    const label = screen.getByLabelText("Label")

    fireEvent.change(label, { target: { value: "Orders DB" } })

    expect(onNodeChange).not.toHaveBeenCalled()

    fireEvent.blur(label)

    expect(onNodeChange).toHaveBeenCalledExactlyOnceWith("orders", {
      label: "Orders DB",
    })
  })

  it("clears an emptied technology instead of storing an empty string", () => {
    const { onNodeChange } = renderNode()
    const technology = screen.getByLabelText("Technology")

    fireEvent.change(technology, { target: { value: "   " } })
    fireEvent.blur(technology)

    expect(onNodeChange).toHaveBeenCalledExactlyOnceWith("orders", {
      technology: undefined,
    })
  })

  it("shows the remaining characters only near the description limit", () => {
    renderNode()
    const description = screen.getByLabelText("Description")

    expect(screen.queryByText(/characters left/)).toBeNull()

    fireEvent.change(description, {
      target: { value: "x".repeat(CANVAS_LIMITS.maxDescription - 40) },
    })

    expect(screen.getByText("40 characters left")).toBeTruthy()
  })

  it("applies the kind's shape and color only when asked", () => {
    const { onNodeChange } = renderNode()

    fireEvent.click(screen.getByRole("button", { name: /apply kind style/i }))

    expect(onNodeChange).toHaveBeenCalledExactlyOnceWith("orders", {
      shape: "cylinder",
      color: "green",
    })
  })

  it("changes the kind without restyling the node", async () => {
    const { onNodeChange } = renderNode()

    fireEvent.click(screen.getByLabelText("Kind"))
    const option = await screen.findByRole("option", { name: "Cache" })

    // The menu renders in a portal, outside the panel's own `.nokey`.
    expect(option.closest(".nokey")).not.toBeNull()

    // Base UI ignores a mouse click on an item that was not pressed first.
    fireEvent.pointerDown(option)
    fireEvent.click(option)

    expect(onNodeChange).toHaveBeenCalledExactlyOnceWith("orders", {
      kind: "cache",
    })
  })

  it("disables Apply kind style when the node already has it", () => {
    renderNode({ shape: "cylinder", color: "green" })

    expect(
      screen
        .getByRole("button", { name: /apply kind style/i })
        .hasAttribute("disabled")
    ).toBe(true)
  })

  it("shows a legacy node without a kind as Generic", () => {
    renderNode({ kind: undefined as unknown as CanvasNode["data"]["kind"] })

    expect(screen.getByLabelText("Kind").textContent).toContain("Generic")
  })

  it("closes through the close button", () => {
    const { onClose } = renderNode()

    fireEvent.click(screen.getByRole("button", { name: "Close inspector" }))

    expect(onClose).toHaveBeenCalledOnce()
  })

  it("names the edge's endpoints", () => {
    renderEdge()

    expect(screen.getByText("API")).toBeTruthy()
    expect(screen.getByText("Orders")).toBeTruthy()
  })

  it("shows an edge without a mode as sync and switches it to async", () => {
    const { onEdgeChange } = renderEdge({ label: "writes" })

    expect(
      screen.getByRole("button", { name: "Sync" }).getAttribute("aria-pressed")
    ).toBe("true")

    fireEvent.click(screen.getByRole("button", { name: "Async" }))

    expect(onEdgeChange).toHaveBeenCalledExactlyOnceWith("e1", {
      mode: "async",
    })
  })

  it("keeps every control inside the React Flow key opt-out", () => {
    renderNode()

    expect(
      screen.getByLabelText("Label").closest(".nokey")
    ).not.toBeNull()
    expect(screen.getByLabelText("Kind").closest(".nokey")).not.toBeNull()
  })
})

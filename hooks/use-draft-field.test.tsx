// @vitest-environment jsdom
import { cleanup, fireEvent, render, screen } from "@testing-library/react"
import { afterEach, describe, expect, it, vi } from "vitest"

import { useDraftField } from "@/hooks/use-draft-field"

interface HarnessProps {
  targetId: string
  value: string
  multiline?: boolean
  maxLength?: number
  onCommit: (targetId: string, value: string) => void
}

function Harness({ multiline, maxLength = 20, ...options }: HarnessProps) {
  const field = useDraftField({ ...options, multiline, maxLength })

  return multiline ? (
    <textarea aria-label="field" {...field} />
  ) : (
    <input aria-label="field" {...field} />
  )
}

function getField() {
  return screen.getByLabelText<HTMLInputElement>("field")
}

afterEach(cleanup)

describe("useDraftField", () => {
  it("follows the stored value until the user types", () => {
    const onCommit = vi.fn()
    const { rerender } = render(
      <Harness targetId="a" value="API" onCommit={onCommit} />
    )

    expect(getField().value).toBe("API")

    rerender(<Harness targetId="a" value="Gateway" onCommit={onCommit} />)

    expect(getField().value).toBe("Gateway")
  })

  it("keeps a draft while a collaborator changes the stored value", () => {
    const onCommit = vi.fn()
    const { rerender } = render(
      <Harness targetId="a" value="API" onCommit={onCommit} />
    )

    fireEvent.change(getField(), { target: { value: "Orders" } })
    rerender(<Harness targetId="a" value="Gateway" onCommit={onCommit} />)

    expect(getField().value).toBe("Orders")
    expect(onCommit).not.toHaveBeenCalled()
  })

  it("commits the trimmed draft on blur", () => {
    const onCommit = vi.fn()
    render(<Harness targetId="a" value="API" onCommit={onCommit} />)

    fireEvent.change(getField(), { target: { value: "  Orders  " } })
    fireEvent.blur(getField())

    expect(onCommit).toHaveBeenCalledExactlyOnceWith("a", "Orders")
  })

  it("commits on Enter in a single-line field", () => {
    const onCommit = vi.fn()
    render(<Harness targetId="a" value="" onCommit={onCommit} />)

    fireEvent.change(getField(), { target: { value: "Orders" } })
    fireEvent.keyDown(getField(), { key: "Enter" })

    expect(onCommit).toHaveBeenCalledExactlyOnceWith("a", "Orders")
  })

  it("keeps Enter for new lines in a multiline field", () => {
    const onCommit = vi.fn()
    render(<Harness targetId="a" value="" multiline onCommit={onCommit} />)

    fireEvent.change(getField(), { target: { value: "Line one" } })
    fireEvent.keyDown(getField(), { key: "Enter" })

    expect(onCommit).not.toHaveBeenCalled()
  })

  it("commits on Escape instead of cancelling", () => {
    const onCommit = vi.fn()
    render(<Harness targetId="a" value="" multiline onCommit={onCommit} />)

    fireEvent.change(getField(), { target: { value: "Owns orders" } })
    fireEvent.keyDown(getField(), { key: "Escape" })

    expect(onCommit).toHaveBeenCalledExactlyOnceWith("a", "Owns orders")
  })

  it("writes nothing when the draft matches the value it started from", () => {
    const onCommit = vi.fn()
    render(<Harness targetId="a" value="API" onCommit={onCommit} />)

    fireEvent.change(getField(), { target: { value: "APIs" } })
    fireEvent.change(getField(), { target: { value: "API " } })
    fireEvent.blur(getField())

    expect(onCommit).not.toHaveBeenCalled()
  })

  it("commits once, even when Enter is followed by a blur", () => {
    const onCommit = vi.fn()
    render(<Harness targetId="a" value="" onCommit={onCommit} />)

    fireEvent.change(getField(), { target: { value: "Orders" } })
    fireEvent.keyDown(getField(), { key: "Enter" })
    fireEvent.blur(getField())

    expect(onCommit).toHaveBeenCalledOnce()
  })

  it("commits to the original element when the selection changes mid-edit", () => {
    const onCommit = vi.fn()
    const { rerender } = render(
      <Harness targetId="a" value="API" onCommit={onCommit} />
    )

    fireEvent.change(getField(), { target: { value: "Orders" } })
    rerender(<Harness targetId="b" value="Database" onCommit={onCommit} />)

    expect(onCommit).toHaveBeenCalledExactlyOnceWith("a", "Orders")
    expect(getField().value).toBe("Database")

    fireEvent.blur(getField())

    expect(onCommit).toHaveBeenCalledOnce()
  })

  it("commits a pending draft when the field unmounts", () => {
    const onCommit = vi.fn()
    const { unmount } = render(
      <Harness targetId="a" value="" onCommit={onCommit} />
    )

    fireEvent.change(getField(), { target: { value: "Orders" } })
    unmount()

    expect(onCommit).toHaveBeenCalledExactlyOnceWith("a", "Orders")
  })

  it("never lets a draft exceed maxLength", () => {
    const onCommit = vi.fn()
    render(
      <Harness targetId="a" value="" maxLength={5} onCommit={onCommit} />
    )

    expect(getField().maxLength).toBe(5)

    fireEvent.change(getField(), { target: { value: "Orders service" } })

    expect(getField().value).toBe("Order")

    fireEvent.blur(getField())

    expect(onCommit).toHaveBeenCalledExactlyOnceWith("a", "Order")
  })
})

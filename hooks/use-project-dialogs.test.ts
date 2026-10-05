// @vitest-environment jsdom
import { act, renderHook } from "@testing-library/react"
import { describe, expect, it, vi } from "vitest"

import { useProjectDialogs } from "@/hooks/use-project-dialogs"
import type { Project, ProjectDialogIntent } from "@/types/project"

const project: Project = {
  id: "p1",
  name: "Payments API",
  slug: "payments-api",
  role: "owner",
  updatedAt: "2026-09-30T12:00:00.000Z",
}

/** A promise the test settles by hand, to hold a submit in flight. */
function deferred() {
  let resolve!: () => void
  let reject!: (error: unknown) => void
  const promise = new Promise<void>((onResolve, onReject) => {
    resolve = onResolve
    reject = onReject
  })

  return { promise, resolve, reject }
}

function renderDialogs(onSubmit: (intent: ProjectDialogIntent) => Promise<void>) {
  return renderHook(() => useProjectDialogs({ onSubmit }))
}

describe("useProjectDialogs", () => {
  it("shows the thrown message and keeps the dialog open when a submit fails", async () => {
    const { result } = renderDialogs(() => Promise.reject(new Error("Name already taken.")))

    act(() => result.current.openCreateDialog())
    act(() => result.current.setName("Payments API"))
    await act(async () => result.current.submit())

    expect(result.current.error).toBe("Name already taken.")
    expect(result.current.openDialog).toBe("create")
    expect(result.current.name).toBe("Payments API")
    expect(result.current.isSubmitting).toBe(false)
  })

  it("falls back to an action-specific message", async () => {
    const { result } = renderDialogs(() => Promise.reject("not an Error"))

    act(() => result.current.openDeleteDialog(project))
    await act(async () => result.current.submit())

    expect(result.current.error).toBe("Couldn't delete the project.")
  })

  it("clears the error when the input changes", async () => {
    const { result } = renderDialogs(() => Promise.reject(new Error("Nope.")))

    act(() => result.current.openRenameDialog(project))
    act(() => result.current.setName("Billing API"))
    await act(async () => result.current.submit())
    act(() => result.current.setName("Billing API v2"))

    expect(result.current.error).toBeNull()
  })

  it("clears the error when the dialog closes", async () => {
    const { result } = renderDialogs(() => Promise.reject(new Error("Nope.")))

    act(() => result.current.openDeleteDialog(project))
    await act(async () => result.current.submit())
    act(() => result.current.closeDialog())

    expect(result.current.error).toBeNull()

    act(() => result.current.openDeleteDialog(project))

    expect(result.current.error).toBeNull()
  })

  it("clears the error when a new submit starts", async () => {
    const pending = deferred()
    const onSubmit = vi
      .fn<(intent: ProjectDialogIntent) => Promise<void>>()
      .mockRejectedValueOnce(new Error("Nope."))
      .mockReturnValueOnce(pending.promise)
    const { result } = renderDialogs(onSubmit)

    act(() => result.current.openDeleteDialog(project))
    await act(async () => result.current.submit())
    expect(result.current.error).toBe("Nope.")

    act(() => result.current.submit())

    expect(result.current.error).toBeNull()
    expect(result.current.isSubmitting).toBe(true)

    await act(async () => pending.resolve())
  })

  it("toggles isSubmitting around the request and closes on success", async () => {
    const pending = deferred()
    const { result } = renderDialogs(() => pending.promise)

    act(() => result.current.openCreateDialog())
    act(() => result.current.setName("Payments API"))
    act(() => result.current.submit())

    expect(result.current.isSubmitting).toBe(true)
    expect(result.current.canSubmit).toBe(false)

    await act(async () => pending.resolve())

    expect(result.current.isSubmitting).toBe(false)
    expect(result.current.openDialog).toBeNull()
  })

  it("sends one request for a double submit in the same frame", async () => {
    const pending = deferred()
    const onSubmit = vi.fn(() => pending.promise)
    const { result } = renderDialogs(onSubmit)

    act(() => result.current.openCreateDialog())
    act(() => result.current.setName("Payments API"))
    act(() => {
      result.current.submit()
      result.current.submit()
    })

    expect(onSubmit).toHaveBeenCalledTimes(1)
    expect(onSubmit).toHaveBeenCalledWith({
      kind: "create",
      name: "Payments API",
      slug: "payments-api",
    })

    await act(async () => pending.resolve())
  })

  it("allows closing mid-submit, and a late failure does not reopen or mark the next dialog", async () => {
    const pending = deferred()
    const { result } = renderDialogs(() => pending.promise)

    act(() => result.current.openRenameDialog(project))
    act(() => result.current.setName("Billing API"))
    act(() => result.current.submit())
    act(() => result.current.closeDialog())

    expect(result.current.openDialog).toBeNull()
    expect(result.current.isSubmitting).toBe(false)

    act(() => result.current.openCreateDialog())
    await act(async () => pending.reject(new Error("Too late.")))

    expect(result.current.openDialog).toBe("create")
    expect(result.current.error).toBeNull()
    expect(result.current.isSubmitting).toBe(false)
  })

  it("does not let a late success close a dialog opened after it", async () => {
    const pending = deferred()
    const { result } = renderDialogs(() => pending.promise)

    act(() => result.current.openDeleteDialog(project))
    act(() => result.current.submit())
    act(() => result.current.closeDialog())
    act(() => result.current.openCreateDialog())
    await act(async () => pending.resolve())

    expect(result.current.openDialog).toBe("create")
  })
})

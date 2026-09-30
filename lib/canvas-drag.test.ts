import { describe, expect, it } from "vitest"

import {
  parseCanvasShapeDragPayload,
  serializeCanvasShapeDragPayload,
} from "@/lib/canvas-drag"
import { DEFAULT_NODE_SIZES } from "@/types/canvas"

describe("parseCanvasShapeDragPayload", () => {
  it("round-trips a serialized payload", () => {
    expect(parseCanvasShapeDragPayload(serializeCanvasShapeDragPayload("diamond"))).toEqual({
      shape: "diamond",
      ...DEFAULT_NODE_SIZES.diamond,
    })
  })

  it("keeps only the known fields of a valid payload", () => {
    const serialized = JSON.stringify({ shape: "circle", width: 50, height: 40, extra: true })

    expect(parseCanvasShapeDragPayload(serialized)).toEqual({
      shape: "circle",
      width: 50,
      height: 40,
    })
  })

  it("rejects an unknown shape", () => {
    const serialized = JSON.stringify({ shape: "star", width: 100, height: 100 })

    expect(parseCanvasShapeDragPayload(serialized)).toBeNull()
  })

  it("rejects malformed JSON", () => {
    expect(parseCanvasShapeDragPayload("{not json")).toBeNull()
    expect(parseCanvasShapeDragPayload("")).toBeNull()
  })

  it("rejects values that are not payload objects", () => {
    expect(parseCanvasShapeDragPayload("null")).toBeNull()
    expect(parseCanvasShapeDragPayload("42")).toBeNull()
    expect(parseCanvasShapeDragPayload(JSON.stringify({ shape: "circle" }))).toBeNull()
  })

  it.each([
    [0, 100],
    [100, -1],
    ["100", 100],
    [100, null],
  ])("rejects a width of %j and height of %j", (width, height) => {
    const serialized = JSON.stringify({ shape: "rectangle", width, height })

    expect(parseCanvasShapeDragPayload(serialized)).toBeNull()
  })
})

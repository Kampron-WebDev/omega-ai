import { describe, expect, it } from "vitest"

import { getInspectorTarget } from "@/lib/canvas-selection"

describe("getInspectorTarget", () => {
  it("opens on exactly one node", () => {
    expect(getInspectorTarget({ nodeIds: ["a"], edgeIds: [] })).toEqual({
      type: "node",
      id: "a",
    })
  })

  it("opens on exactly one edge", () => {
    expect(getInspectorTarget({ nodeIds: [], edgeIds: ["e1"] })).toEqual({
      type: "edge",
      id: "e1",
    })
  })

  it("closes when nothing is selected", () => {
    expect(getInspectorTarget({ nodeIds: [], edgeIds: [] })).toBeNull()
  })

  it("closes on two nodes", () => {
    expect(getInspectorTarget({ nodeIds: ["a", "b"], edgeIds: [] })).toBeNull()
  })

  it("closes on two edges", () => {
    expect(
      getInspectorTarget({ nodeIds: [], edgeIds: ["e1", "e2"] })
    ).toBeNull()
  })

  it("closes on a node plus an edge", () => {
    expect(getInspectorTarget({ nodeIds: ["a"], edgeIds: ["e1"] })).toBeNull()
  })
})

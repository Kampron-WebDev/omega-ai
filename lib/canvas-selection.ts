/** The IDs React Flow reports as selected, local to this client. */
interface CanvasSelection {
  nodeIds: readonly string[]
  edgeIds: readonly string[]
}

/** The one element the inspector shows. */
type InspectorTarget =
  | { type: "node"; id: string }
  | { type: "edge"; id: string }

const EMPTY_CANVAS_SELECTION: CanvasSelection = { nodeIds: [], edgeIds: [] }

/**
 * The inspector edits exactly one element: one node and nothing else, or one
 * edge and nothing else. Zero elements, or two of any mix, close it.
 */
function getInspectorTarget({
  nodeIds,
  edgeIds,
}: CanvasSelection): InspectorTarget | null {
  if (nodeIds.length + edgeIds.length !== 1) {
    return null
  }

  return nodeIds.length === 1
    ? { type: "node", id: nodeIds[0] }
    : { type: "edge", id: edgeIds[0] }
}

export { EMPTY_CANVAS_SELECTION, getInspectorTarget }
export type { CanvasSelection, InspectorTarget }

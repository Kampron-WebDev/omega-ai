import { MarkerType, type DefaultEdgeOptions } from "@xyflow/react"

import { EDGE_COLOR } from "@/types/canvas"

/**
 * The shape every canvas edge is stored with. React Flow merges these into
 * each hand-drawn connection before `useLiveblocksFlow`'s `onConnect` persists
 * it, and starter templates build their edges from the same object, so an
 * imported edge is indistinguishable from one a user drew.
 */
const NEW_EDGE_OPTIONS = {
  type: "canvasEdge" as const,
  markerEnd: {
    type: MarkerType.ArrowClosed,
    color: EDGE_COLOR,
    width: 16,
    height: 16,
  },
  data: { label: "" },
} satisfies DefaultEdgeOptions

export { NEW_EDGE_OPTIONS }

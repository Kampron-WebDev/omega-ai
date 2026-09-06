import {
  DEFAULT_NODE_SIZES,
  NODE_SHAPES,
  type CanvasNodeSize,
  type NodeShapeId,
} from "@/types/canvas"

const CANVAS_SHAPE_DRAG_TYPE = "application/x-omega-canvas-shape"

interface CanvasShapeDragPayload extends CanvasNodeSize {
  shape: NodeShapeId
}

function isNodeShapeId(value: unknown): value is NodeShapeId {
  return (
    typeof value === "string" &&
    (NODE_SHAPES as readonly string[]).includes(value)
  )
}

function getCanvasShapeDragPayload(
  shape: NodeShapeId
): CanvasShapeDragPayload {
  return { shape, ...DEFAULT_NODE_SIZES[shape] }
}

function serializeCanvasShapeDragPayload(shape: NodeShapeId): string {
  return JSON.stringify(getCanvasShapeDragPayload(shape))
}

function parseCanvasShapeDragPayload(
  serializedPayload: string
): CanvasShapeDragPayload | null {
  try {
    const payload: unknown = JSON.parse(serializedPayload)

    if (
      typeof payload !== "object" ||
      payload === null ||
      !("shape" in payload) ||
      !("width" in payload) ||
      !("height" in payload) ||
      !isNodeShapeId(payload.shape) ||
      typeof payload.width !== "number" ||
      !Number.isFinite(payload.width) ||
      payload.width <= 0 ||
      typeof payload.height !== "number" ||
      !Number.isFinite(payload.height) ||
      payload.height <= 0
    ) {
      return null
    }

    return {
      shape: payload.shape,
      width: payload.width,
      height: payload.height,
    }
  } catch {
    return null
  }
}

export {
  CANVAS_SHAPE_DRAG_TYPE,
  getCanvasShapeDragPayload,
  parseCanvasShapeDragPayload,
  serializeCanvasShapeDragPayload,
}
export type { CanvasShapeDragPayload }

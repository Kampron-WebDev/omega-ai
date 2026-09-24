import type { CanvasTemplate } from "@/components/editor/starter-templates"
import { EDGE_COLOR, NODE_COLORS, type CanvasNode } from "@/types/canvas"

/** Canvas units of breathing room around the diagram inside the viewport. */
const PREVIEW_PADDING = 40

interface NodeBox {
  cx: number
  cy: number
  width: number
  height: number
}

/**
 * The node's box in canvas units. Template nodes are placed by their centre
 * (`origin: [0.5, 0.5]`), so `position` is already the centre point.
 */
function getNodeBox(node: CanvasNode): NodeBox {
  return {
    cx: node.position.x,
    cy: node.position.y,
    width: node.width ?? 0,
    height: node.height ?? 0,
  }
}

function PreviewNode({ node }: { node: CanvasNode }) {
  const { cx, cy, width, height } = getNodeBox(node)
  const color =
    NODE_COLORS.find(({ id }) => id === node.data.color) ?? NODE_COLORS[0]
  const left = cx - width / 2
  const top = cy - height / 2
  const shapeProps = {
    fill: color.fill,
    strokeWidth: 1,
    vectorEffect: "non-scaling-stroke" as const,
    style: { stroke: "var(--border-subtle)" },
  }

  switch (node.data.shape) {
    case "circle":
      return (
        <ellipse cx={cx} cy={cy} rx={width / 2} ry={height / 2} {...shapeProps} />
      )
    case "diamond":
      return (
        <polygon
          points={`${cx},${top} ${left + width},${cy} ${cx},${top + height} ${left},${cy}`}
          {...shapeProps}
        />
      )
    case "hexagon":
      return (
        <polygon
          points={[
            `${left + width * 0.25},${top}`,
            `${left + width * 0.75},${top}`,
            `${left + width},${cy}`,
            `${left + width * 0.75},${top + height}`,
            `${left + width * 0.25},${top + height}`,
            `${left},${cy}`,
          ].join(" ")}
          {...shapeProps}
        />
      )
    default: {
      // Rectangle, pill, and cylinder differ only in corner rounding at this size.
      const cornerX =
        node.data.shape === "rectangle" ? 12 : node.data.shape === "pill" ? height / 2 : width / 2
      const cornerY =
        node.data.shape === "cylinder" ? height * 0.14 : cornerX

      return (
        <rect
          x={left}
          y={top}
          width={width}
          height={height}
          rx={cornerX}
          ry={cornerY}
          {...shapeProps}
        />
      )
    }
  }
}

/**
 * A static thumbnail of a template: nodes drawn from their shape and color,
 * edges as straight lines between node centres, scaled into a fixed viewport
 * by an SVG `viewBox` computed from the node bounds. No React Flow instance.
 */
function StarterTemplatePreview({ template }: { template: CanvasTemplate }) {
  const boxes = new Map(
    template.nodes.map((node) => [node.id, getNodeBox(node)])
  )
  const allBoxes = [...boxes.values()]
  const minX = Math.min(...allBoxes.map(({ cx, width }) => cx - width / 2))
  const maxX = Math.max(...allBoxes.map(({ cx, width }) => cx + width / 2))
  const minY = Math.min(...allBoxes.map(({ cy, height }) => cy - height / 2))
  const maxY = Math.max(...allBoxes.map(({ cy, height }) => cy + height / 2))
  const viewBox = [
    minX - PREVIEW_PADDING,
    minY - PREVIEW_PADDING,
    maxX - minX + PREVIEW_PADDING * 2,
    maxY - minY + PREVIEW_PADDING * 2,
  ].join(" ")

  return (
    <svg
      aria-hidden="true"
      viewBox={viewBox}
      preserveAspectRatio="xMidYMid meet"
      className="h-32 w-full rounded-xl border border-border/60 bg-background"
    >
      {template.edges.map((edge) => {
        const source = boxes.get(edge.source)
        const target = boxes.get(edge.target)

        if (!source || !target) {
          return null
        }

        return (
          <line
            key={edge.id}
            x1={source.cx}
            y1={source.cy}
            x2={target.cx}
            y2={target.cy}
            stroke={EDGE_COLOR}
            strokeOpacity={0.45}
            strokeWidth={1}
            vectorEffect="non-scaling-stroke"
          />
        )
      })}
      {template.nodes.map((node) => (
        <PreviewNode key={node.id} node={node} />
      ))}
    </svg>
  )
}

export { StarterTemplatePreview }

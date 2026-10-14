"use client"

import { useId, type ReactNode } from "react"
import { ArrowRight, Cable, Paintbrush, X } from "lucide-react"

import { NodeKindIcon } from "@/components/editor/node-kind-icon"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { useDraftField } from "@/hooks/use-draft-field"
import { CANVAS_LIMITS, resolveNodeKind } from "@/lib/canvas-schema"
import { cn } from "@/lib/utils"
import {
  EDGE_MODES,
  EDGE_PROTOCOL_LABELS,
  EDGE_PROTOCOLS,
  NODE_KINDS,
  type CanvasEdge,
  type CanvasEdgeData,
  type CanvasNode,
  type CanvasNodeData,
  type EdgeModeId,
  type EdgeProtocolId,
  type NodeKindId,
} from "@/types/canvas"

/** Below this many characters left, the description shows a countdown. */
const DESCRIPTION_HINT_THRESHOLD = 100

const EDGE_MODE_LABELS: Record<EdgeModeId, string> = {
  sync: "Sync",
  async: "Async",
}

const NODE_KIND_ITEMS = NODE_KINDS.map(({ id, label }) => ({ value: id, label }))
const EDGE_PROTOCOL_ITEMS = [
  { value: null, label: "None" },
  ...EDGE_PROTOCOLS.map((id) => ({ value: id, label: EDGE_PROTOCOL_LABELS[id] })),
]

/**
 * Keeps the panel and its select menus out of React Flow's key handling
 * (`deleteKeyCode` ignores `.nokey`) and the canvas shortcuts, which treat
 * `.nokey` as editable too. The menus render in a portal, so they need it
 * on their own popup.
 */
const NO_KEY_CLASS = "nokey"

function isEdgeProtocolId(value: unknown): value is EdgeProtocolId {
  return (EDGE_PROTOCOLS as readonly unknown[]).includes(value)
}

type InspectorElement =
  | { type: "node"; node: CanvasNode }
  | {
      type: "edge"
      edge: CanvasEdge
      sourceLabel: string
      targetLabel: string
    }

interface CanvasInspectorProps {
  element: InspectorElement
  onNodeChange: (nodeId: string, data: Partial<CanvasNodeData>) => void
  onEdgeChange: (edgeId: string, data: Partial<CanvasEdgeData>) => void
  onClose: () => void
}

/**
 * The floating panel that edits what the one selected node or edge is. It
 * writes only through the callbacks it is given, the flow's
 * `updateNodeData`/`updateEdgeData`, and never touches Liveblocks itself.
 */
function CanvasInspector({
  element,
  onNodeChange,
  onEdgeChange,
  onClose,
}: CanvasInspectorProps) {
  const titleId = useId()
  const isNode = element.type === "node"

  return (
    <section
      aria-labelledby={titleId}
      className={cn(
        NO_KEY_CLASS,
        "nodrag nopan nowheel absolute top-4 left-4 z-10 flex max-h-[calc(100%-2rem)] w-72 flex-col rounded-2xl border border-border-default bg-bg-surface/95 shadow-lg backdrop-blur"
      )}
    >
      <header className="flex items-center gap-2 border-b border-border-default py-2 pr-2 pl-4">
        {isNode ? (
          <NodeKindIcon
            kind={resolveNodeKind(element.node.data.kind)}
            className="size-4 text-copy-secondary"
          />
        ) : (
          <Cable aria-hidden="true" className="size-4 text-copy-secondary" />
        )}
        <h2 id={titleId} className="flex-1 text-sm font-medium text-copy-primary">
          {isNode ? "Component" : "Connection"}
        </h2>
        <Button
          type="button"
          variant="ghost"
          size="icon-sm"
          aria-label="Close inspector"
          title="Close"
          className="text-copy-muted hover:text-copy-primary"
          onClick={onClose}
        >
          <X />
        </Button>
      </header>
      <div className="flex min-h-0 flex-col gap-3 overflow-y-auto p-4">
        {isNode ? (
          <NodeFields node={element.node} onChange={onNodeChange} />
        ) : (
          <EdgeFields
            edge={element.edge}
            sourceLabel={element.sourceLabel}
            targetLabel={element.targetLabel}
            onChange={onEdgeChange}
          />
        )}
      </div>
    </section>
  )
}

interface NodeFieldsProps {
  node: CanvasNode
  onChange: CanvasInspectorProps["onNodeChange"]
}

function NodeFields({ node, onChange }: NodeFieldsProps) {
  const fieldId = useId()
  const kind = resolveNodeKind(node.data.kind)
  const kindDefaults = NODE_KINDS.find(({ id }) => id === kind) ?? NODE_KINDS[0]
  const hasKindStyle =
    node.data.shape === kindDefaults.defaultShape &&
    node.data.color === kindDefaults.defaultColor

  return (
    <>
      <InspectorField label="Label" htmlFor={`${fieldId}-label`}>
        <DraftTextField
          id={`${fieldId}-label`}
          targetId={node.id}
          value={node.data.label}
          maxLength={CANVAS_LIMITS.maxLabel}
          placeholder="Add label"
          onCommit={(nodeId, label) => onChange(nodeId, { label })}
        />
      </InspectorField>
      <InspectorField label="Kind" htmlFor={`${fieldId}-kind`}>
        <Select
          items={NODE_KIND_ITEMS}
          value={kind}
          onValueChange={(value: NodeKindId | null) => {
            // Kind is meaning, not style: shape and color stay as they are
            // until the user asks for the kind's look below.
            if (value) {
              onChange(node.id, { kind: value })
            }
          }}
        >
          <SelectTrigger id={`${fieldId}-kind`} className="w-full">
            <SelectValue>
              {(value: NodeKindId) => (
                <>
                  <NodeKindIcon kind={value} />
                  {NODE_KINDS.find(({ id }) => id === value)?.label}
                </>
              )}
            </SelectValue>
          </SelectTrigger>
          <SelectContent className={NO_KEY_CLASS}>
            {NODE_KINDS.map(({ id, label }) => (
              <SelectItem key={id} value={id}>
                <NodeKindIcon kind={id} />
                {label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </InspectorField>
      <Button
        type="button"
        variant="outline"
        size="sm"
        className="self-start"
        disabled={hasKindStyle}
        title={
          hasKindStyle
            ? `Already styled as ${kindDefaults.label}`
            : `Use the ${kindDefaults.label} shape and color`
        }
        onClick={() =>
          onChange(node.id, {
            shape: kindDefaults.defaultShape,
            color: kindDefaults.defaultColor,
          })
        }
      >
        <Paintbrush aria-hidden="true" />
        Apply kind style
      </Button>
      <InspectorField label="Technology" htmlFor={`${fieldId}-technology`}>
        <DraftTextField
          id={`${fieldId}-technology`}
          targetId={node.id}
          value={node.data.technology ?? ""}
          maxLength={CANVAS_LIMITS.maxTechnology}
          placeholder="e.g. PostgreSQL 16"
          onCommit={(nodeId, technology) =>
            onChange(nodeId, { technology: technology || undefined })
          }
        />
      </InspectorField>
      <InspectorField label="Description" htmlFor={`${fieldId}-description`}>
        <DraftTextField
          id={`${fieldId}-description`}
          targetId={node.id}
          value={node.data.description ?? ""}
          maxLength={CANVAS_LIMITS.maxDescription}
          placeholder="What it does and what it owns"
          multiline
          onCommit={(nodeId, description) =>
            onChange(nodeId, { description: description || undefined })
          }
        />
      </InspectorField>
    </>
  )
}

interface EdgeFieldsProps {
  edge: CanvasEdge
  sourceLabel: string
  targetLabel: string
  onChange: CanvasInspectorProps["onEdgeChange"]
}

function EdgeFields({ edge, sourceLabel, targetLabel, onChange }: EdgeFieldsProps) {
  const fieldId = useId()
  // A protocol this client does not know reads as none, as on the edge badge.
  const protocol = isEdgeProtocolId(edge.data?.protocol)
    ? edge.data.protocol
    : null
  // An edge without a mode draws solid, so it is shown as sync.
  const mode: EdgeModeId = edge.data?.mode === "async" ? "async" : "sync"

  return (
    <>
      <p className="flex min-w-0 items-center gap-1.5 text-xs text-copy-muted">
        <span className="sr-only">From </span>
        <span className="min-w-0 truncate text-copy-secondary">{sourceLabel}</span>
        <ArrowRight aria-label="to" className="size-3.5 shrink-0" />
        <span className="min-w-0 truncate text-copy-secondary">{targetLabel}</span>
      </p>
      <InspectorField label="Label" htmlFor={`${fieldId}-label`}>
        <DraftTextField
          id={`${fieldId}-label`}
          targetId={edge.id}
          value={edge.data?.label ?? ""}
          maxLength={CANVAS_LIMITS.maxEdgeLabel}
          placeholder="Add label"
          onCommit={(edgeId, label) => onChange(edgeId, { label })}
        />
      </InspectorField>
      <InspectorField label="Protocol" htmlFor={`${fieldId}-protocol`}>
        <Select
          items={EDGE_PROTOCOL_ITEMS}
          value={protocol}
          onValueChange={(value: EdgeProtocolId | null) =>
            onChange(edge.id, { protocol: value ?? undefined })
          }
        >
          <SelectTrigger id={`${fieldId}-protocol`} className="w-full">
            <SelectValue />
          </SelectTrigger>
          <SelectContent className={NO_KEY_CLASS}>
            {EDGE_PROTOCOL_ITEMS.map(({ value, label }) => (
              <SelectItem key={value ?? "none"} value={value}>
                {label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </InspectorField>
      <div className="flex flex-col gap-1.5">
        <span id={`${fieldId}-mode`} className="text-xs font-medium text-copy-secondary">
          Mode
        </span>
        <div
          role="group"
          aria-labelledby={`${fieldId}-mode`}
          className="grid grid-cols-2 gap-1 rounded-lg border border-border-default bg-bg-elevated p-0.5"
        >
          {EDGE_MODES.map((option) => {
            const isActive = option === mode

            return (
              <button
                key={option}
                type="button"
                aria-pressed={isActive}
                className={cn(
                  "h-7 rounded-md text-xs font-medium transition-colors outline-none focus-visible:ring-2 focus-visible:ring-brand",
                  isActive
                    ? "bg-accent-dim text-brand"
                    : "text-copy-muted hover:text-copy-primary"
                )}
                onClick={() => {
                  if (!isActive) {
                    onChange(edge.id, { mode: option })
                  }
                }}
              >
                {EDGE_MODE_LABELS[option]}
              </button>
            )
          })}
        </div>
      </div>
    </>
  )
}

interface InspectorFieldProps {
  label: string
  htmlFor: string
  children: ReactNode
}

function InspectorField({ label, htmlFor, children }: InspectorFieldProps) {
  return (
    <div className="flex flex-col gap-1.5">
      <label htmlFor={htmlFor} className="text-xs font-medium text-copy-secondary">
        {label}
      </label>
      {children}
    </div>
  )
}

interface DraftTextFieldProps {
  id: string
  targetId: string
  value: string
  maxLength: number
  placeholder: string
  multiline?: boolean
  onCommit: (targetId: string, value: string) => void
}

function DraftTextField({
  id,
  targetId,
  value,
  maxLength,
  placeholder,
  multiline = false,
  onCommit,
}: DraftTextFieldProps) {
  const field = useDraftField({ targetId, value, maxLength, multiline, onCommit })

  if (!multiline) {
    return <Input id={id} placeholder={placeholder} {...field} />
  }

  const remaining = maxLength - field.value.length
  const hintId = `${id}-hint`
  const showHint = remaining <= DESCRIPTION_HINT_THRESHOLD

  return (
    <>
      <Textarea
        id={id}
        placeholder={placeholder}
        aria-describedby={showHint ? hintId : undefined}
        className="max-h-48 resize-none"
        {...field}
      />
      {showHint ? (
        <p
          id={hintId}
          className={cn(
            "text-right text-xs",
            remaining === 0 ? "text-destructive" : "text-copy-muted"
          )}
        >
          {remaining === 1 ? "1 character left" : `${remaining} characters left`}
        </p>
      ) : null}
    </>
  )
}

export { CanvasInspector }
export type { InspectorElement }

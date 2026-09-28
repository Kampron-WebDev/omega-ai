"use client"

import { useLayoutEffect, useRef, type Ref } from "react"
import { SendHorizontal } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"

interface AiChatComposerProps {
  value: string
  onChange: (value: string) => void
  onSubmit: () => void
  ref?: Ref<HTMLTextAreaElement>
}

const MIN_HEIGHT_PX = 72
const MAX_HEIGHT_PX = 160

/**
 * Prompt input for the AI sidebar. Grows with its content between 72px and
 * 160px, then scrolls. Enter submits; Shift+Enter inserts a newline.
 */
function AiChatComposer({ value, onChange, onSubmit, ref }: AiChatComposerProps) {
  const textareaRef = useRef<HTMLTextAreaElement>(null)
  const canSubmit = value.trim().length > 0

  // Sized in JS rather than with `field-sizing: content`, which Firefox does
  // not support yet. Runs on every value change, including programmatic ones
  // like picking a starter prompt or clearing after submit.
  useLayoutEffect(() => {
    const textarea = textareaRef.current
    if (!textarea) return

    textarea.style.height = "auto"
    const height = Math.min(
      Math.max(textarea.scrollHeight, MIN_HEIGHT_PX),
      MAX_HEIGHT_PX
    )
    textarea.style.height = `${height}px`
    textarea.style.overflowY =
      textarea.scrollHeight > MAX_HEIGHT_PX ? "auto" : "hidden"
  }, [value])

  function setRefs(node: HTMLTextAreaElement | null) {
    textareaRef.current = node
    if (typeof ref === "function") ref(node)
    else if (ref) ref.current = node
  }

  return (
    <form
      className="shrink-0 border-t border-border-default p-3"
      onSubmit={(event) => {
        event.preventDefault()
        if (canSubmit) onSubmit()
      }}
    >
      <div className="relative">
        <Textarea
          ref={setRefs}
          value={value}
          onChange={(event) => onChange(event.target.value)}
          onKeyDown={(event) => {
            // Leave Enter alone mid-composition so IME users can confirm text.
            if (
              event.key === "Enter" &&
              !event.shiftKey &&
              !event.nativeEvent.isComposing
            ) {
              event.preventDefault()
              if (canSubmit) onSubmit()
            }
          }}
          placeholder="Describe a system to design…"
          aria-label="Message Ghost AI"
          rows={1}
          className="field-sizing-fixed min-h-18 resize-none rounded-xl border-border-default bg-bg-elevated pr-12 text-copy-primary placeholder:text-copy-faint dark:bg-bg-elevated"
        />
        <Button
          type="submit"
          size="icon-sm"
          disabled={!canSubmit}
          aria-label="Send message"
          className="absolute right-2 bottom-2 bg-ai text-white hover:bg-ai/85"
        >
          <SendHorizontal />
        </Button>
      </div>
      <p className="mt-1.5 text-[0.7rem] text-copy-faint">
        Enter to send · Shift+Enter for a new line
      </p>
    </form>
  )
}

export { AiChatComposer }

"use client"

import { useEffect, useRef, useState } from "react"
import { Bot } from "lucide-react"

import { AiChatComposer } from "@/components/editor/ai-chat-composer"
import { ScrollArea } from "@/components/ui/scroll-area"
import { cn } from "@/lib/utils"

interface AiChatMessage {
  id: string
  role: "user" | "assistant"
  content: string
}

const STARTER_PROMPTS = [
  "Design an e-commerce backend",
  "Create a chat app architecture",
  "Build a CI/CD pipeline",
] as const

function AiChatEmptyState({
  onSelectPrompt,
}: {
  onSelectPrompt: (prompt: string) => void
}) {
  return (
    <div className="flex h-full flex-col items-center justify-center gap-4 px-6 py-10 text-center">
      <div className="flex size-14 items-center justify-center rounded-2xl bg-ai/15 text-ai-text">
        <Bot className="size-8" />
      </div>
      <div className="space-y-1">
        <p className="text-sm font-medium text-copy-primary">
          Describe the system you want to build
        </p>
        <p className="text-xs text-copy-muted">
          Ghost AI sketches the architecture on the canvas for everyone in the
          room.
        </p>
      </div>
      <div className="flex flex-wrap justify-center gap-2">
        {STARTER_PROMPTS.map((prompt) => (
          <button
            key={prompt}
            type="button"
            onClick={() => onSelectPrompt(prompt)}
            className="rounded-full bg-bg-subtle px-3 py-1.5 text-xs text-ai-text transition-colors outline-none hover:bg-ai/15 focus-visible:ring-3 focus-visible:ring-ring/50"
          >
            {prompt}
          </button>
        ))}
      </div>
    </div>
  )
}

function AiChatBubble({ message }: { message: AiChatMessage }) {
  const isUser = message.role === "user"

  return (
    <li className={cn("flex", isUser ? "justify-end" : "justify-start")}>
      <p
        className={cn(
          "max-w-[85%] rounded-2xl px-3 py-2 text-sm whitespace-pre-wrap break-words",
          isUser
            ? "rounded-br-md border-2 border-brand/50 bg-accent-dim text-copy-primary"
            : "rounded-bl-md border border-border-default bg-bg-elevated text-ai-text"
        )}
      >
        {message.content}
      </p>
    </li>
  )
}

/**
 * The chat half of the AI sidebar. Messages live in local state only and
 * nothing replies — the shared `ai-chat` feed (spec 30) and the design agent
 * (specs 32–33) replace this state without changing the layout.
 */
function AiArchitectTab() {
  const [messages, setMessages] = useState<AiChatMessage[]>([])
  const [draft, setDraft] = useState("")
  const composerRef = useRef<HTMLTextAreaElement>(null)
  const feedEndRef = useRef<HTMLDivElement>(null)

  // Keep the newest message in view. `nearest` scrolls only the feed, never
  // the page behind the fixed panel.
  useEffect(() => {
    if (messages.length === 0) return
    feedEndRef.current?.scrollIntoView({ block: "nearest" })
  }, [messages])

  function handleSubmit() {
    const content = draft.trim()
    if (!content) return

    setMessages((current) => [
      ...current,
      { id: crypto.randomUUID(), role: "user", content },
    ])
    setDraft("")
  }

  function handleSelectPrompt(prompt: string) {
    setDraft(prompt)
    composerRef.current?.focus()
  }

  return (
    <>
      <ScrollArea className="min-h-0 flex-1">
        {messages.length === 0 ? (
          <AiChatEmptyState onSelectPrompt={handleSelectPrompt} />
        ) : (
          <ol className="flex flex-col gap-3 px-4 py-4">
            {messages.map((message) => (
              <AiChatBubble key={message.id} message={message} />
            ))}
          </ol>
        )}
        <div ref={feedEndRef} />
      </ScrollArea>

      <AiChatComposer
        ref={composerRef}
        value={draft}
        onChange={setDraft}
        onSubmit={handleSubmit}
      />
    </>
  )
}

export { AiArchitectTab }

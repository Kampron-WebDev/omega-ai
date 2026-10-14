"use client"

import {
  useCallback,
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
  type ChangeEvent,
  type KeyboardEvent,
} from "react"

interface UseDraftFieldOptions {
  /** The node or edge the field edits. A draft always commits to the one it was typed for. */
  targetId: string
  /** The stored value, shown whenever this field holds no local draft. */
  value: string
  maxLength: number
  /** A multiline field keeps Enter for new lines; only blur and Escape commit it. */
  multiline?: boolean
  onCommit: (targetId: string, value: string) => void
}

interface Draft {
  targetId: string
  text: string
  /** The stored value when typing began; an unchanged draft writes nothing. */
  initial: string
}

type FieldElement = HTMLInputElement | HTMLTextAreaElement

/**
 * A text field that edits a synced value through a local draft. The draft
 * commits on blur, on Enter (single-line fields), and on Escape, which saves
 * rather than cancels, like the edge label editor. Until the user types, the
 * field follows the stored value, so a collaborator's change shows live; once
 * they type, their draft holds until it commits (last writer wins).
 *
 * If the target changes or the field unmounts with a draft pending, the draft
 * commits to the element it was typed for, never to the newly selected one.
 */
function useDraftField({
  targetId,
  value,
  maxLength,
  multiline = false,
  onCommit,
}: UseDraftFieldOptions) {
  const [draft, setDraft] = useState<Draft | null>(null)
  const draftRef = useRef<Draft | null>(null)
  const onCommitRef = useRef(onCommit)

  useLayoutEffect(() => {
    onCommitRef.current = onCommit
  }, [onCommit])

  const commit = useCallback(() => {
    const pending = draftRef.current

    if (!pending) {
      return
    }

    draftRef.current = null
    setDraft(null)

    const next = pending.text.trim()

    if (next !== pending.initial) {
      onCommitRef.current(pending.targetId, next)
    }
  }, [])

  // Runs its cleanup when the selection moves to another element, and on
  // unmount, while `draftRef` still names the element the draft belongs to.
  useEffect(() => commit, [targetId, commit])

  function handleChange(event: ChangeEvent<FieldElement>) {
    const current = draftRef.current
    const next: Draft = {
      targetId,
      // `maxLength` stops typing in a browser; this also covers values set
      // by script, so a commit can never exceed the schema limit.
      text: event.target.value.slice(0, maxLength),
      initial: current?.targetId === targetId ? current.initial : value,
    }

    draftRef.current = next
    setDraft(next)
  }

  function handleKeyDown(event: KeyboardEvent<FieldElement>) {
    if (event.nativeEvent.isComposing) {
      return
    }

    if (event.key === "Escape" || (event.key === "Enter" && !multiline)) {
      event.preventDefault()
      commit()
    }
  }

  return {
    value: draft?.targetId === targetId ? draft.text : value,
    maxLength,
    onChange: handleChange,
    onBlur: commit,
    onKeyDown: handleKeyDown,
  }
}

export { useDraftField }

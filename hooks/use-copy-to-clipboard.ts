"use client"

import { useCallback, useEffect, useRef, useState } from "react"

/** How long the `Copied!` confirmation stays up before the label reverts. */
const COPIED_FEEDBACK_MS = 2000

interface CopyToClipboardController {
  /** True while the confirmation is showing. */
  isCopied: boolean
  /** Set when the browser refused the copy — an insecure origin, or no permission. */
  error: string | null
  copy: (text: string) => void
}

/**
 * Copies text and flips a flag for a couple of seconds so a button can confirm
 * it happened.
 *
 * The timer is held in a ref and cleared on unmount, so closing the dialog
 * straight after copying does not leave a `setState` aimed at a gone component.
 */
function useCopyToClipboard(): CopyToClipboardController {
  const [isCopied, setIsCopied] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => {
    return () => {
      if (timeoutRef.current !== null) {
        clearTimeout(timeoutRef.current)
      }
    }
  }, [])

  const copy = useCallback((text: string) => {
    const run = async () => {
      try {
        // Only available on secure origins; the catch covers the rest.
        await navigator.clipboard.writeText(text)
      } catch {
        setError("Couldn't copy the link. Copy it from the address bar instead.")
        return
      }

      setError(null)
      setIsCopied(true)

      // Restart the countdown on a second copy rather than letting the first
      // timer cut the new confirmation short.
      if (timeoutRef.current !== null) {
        clearTimeout(timeoutRef.current)
      }

      timeoutRef.current = setTimeout(() => {
        setIsCopied(false)
        timeoutRef.current = null
      }, COPIED_FEEDBACK_MS)
    }

    void run()
  }, [])

  return { isCopied, error, copy }
}

export { useCopyToClipboard }
export type { CopyToClipboardController }

const MINUTE = 60 * 1000
const HOUR = 60 * MINUTE
const DAY = 24 * HOUR
const WEEK = 7 * DAY

/**
 * A compact "how long ago" label: "just now", "5m ago", "3h ago", "2d ago",
 * "4w ago", and a calendar date beyond that.
 *
 * `now` is a parameter rather than read inside, so the server and the browser
 * can render the same label from the same instant and tests stay deterministic.
 * A time in the future (clock skew) reads as "just now".
 */
function formatRelativeTime(value: string | Date, now: Date): string {
  const time = typeof value === "string" ? new Date(value) : value
  const elapsed = now.getTime() - time.getTime()

  if (elapsed < MINUTE) {
    return "just now"
  }

  if (elapsed < HOUR) {
    return `${Math.floor(elapsed / MINUTE)}m ago`
  }

  if (elapsed < DAY) {
    return `${Math.floor(elapsed / HOUR)}h ago`
  }

  if (elapsed < WEEK) {
    return `${Math.floor(elapsed / DAY)}d ago`
  }

  if (elapsed < 5 * WEEK) {
    return `${Math.floor(elapsed / WEEK)}w ago`
  }

  return time.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: time.getUTCFullYear() === now.getUTCFullYear() ? undefined : "numeric",
    // Fixed so the server and the browser print the same date for one instant.
    timeZone: "UTC",
  })
}

export { formatRelativeTime }

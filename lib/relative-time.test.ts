import { describe, expect, it } from "vitest"

import { formatRelativeTime } from "@/lib/relative-time"

const now = new Date("2026-09-30T12:00:00.000Z")

function ago(milliseconds: number): string {
  return new Date(now.getTime() - milliseconds).toISOString()
}

const MINUTE = 60 * 1000
const HOUR = 60 * MINUTE
const DAY = 24 * HOUR

describe("formatRelativeTime", () => {
  it("says just now under a minute, and for times in the future", () => {
    expect(formatRelativeTime(ago(0), now)).toBe("just now")
    expect(formatRelativeTime(ago(59 * 1000), now)).toBe("just now")
    expect(formatRelativeTime(ago(-5 * MINUTE), now)).toBe("just now")
  })

  it.each([
    [MINUTE, "1m ago"],
    [59 * MINUTE, "59m ago"],
    [HOUR, "1h ago"],
    [23 * HOUR, "23h ago"],
    [DAY, "1d ago"],
    [6 * DAY, "6d ago"],
    [7 * DAY, "1w ago"],
    [34 * DAY, "4w ago"],
  ])("formats %i ms ago as %s", (elapsed, label) => {
    expect(formatRelativeTime(ago(elapsed), now)).toBe(label)
  })

  it("falls back to a date, with the year only when it differs", () => {
    expect(formatRelativeTime("2026-07-04T08:00:00.000Z", now)).toBe("Jul 4")
    expect(formatRelativeTime("2025-12-25T08:00:00.000Z", now)).toBe("Dec 25, 2025")
  })

  it("accepts a Date as well as an ISO string", () => {
    expect(formatRelativeTime(new Date(now.getTime() - 3 * HOUR), now)).toBe("3h ago")
  })
})

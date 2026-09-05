import { Liveblocks } from "@liveblocks/node"

/**
 * A fixed, visually distinct set of cursor colors. This is a data value sent
 * to clients for rendering, not a styling concern, so raw hex values are
 * appropriate here despite `code-standards.md`'s "no hardcoded hex" rule for
 * component styling.
 */
const CURSOR_COLORS = [
  "#f97316",
  "#22c55e",
  "#3b82f6",
  "#a855f7",
  "#ec4899",
  "#eab308",
  "#14b8a6",
  "#ef4444",
] as const

/**
 * Deterministically maps a user ID to one color in the fixed palette, so the
 * same user shows the same cursor color across sessions and rooms.
 */
function getCursorColor(userId: string): string {
  let hash = 0

  for (let index = 0; index < userId.length; index += 1) {
    hash = (hash * 31 + userId.charCodeAt(index)) | 0
  }

  return CURSOR_COLORS[Math.abs(hash) % CURSOR_COLORS.length]
}

function createLiveblocksClient(): Liveblocks {
  const secret = process.env.LIVEBLOCKS_SECRET_KEY

  if (!secret) {
    throw new Error(
      "LIVEBLOCKS_SECRET_KEY is not set. Add it to .env.local before using Liveblocks.",
    )
  }

  return new Liveblocks({ secret })
}

/**
 * `next dev` re-evaluates modules on every hot reload, which would otherwise
 * construct a new client per reload. Caching on `globalThis` survives the
 * reload; production gets a fresh client per server instance and does not
 * need the cache. Mirrors `lib/prisma.ts`.
 */
const globalForLiveblocks = globalThis as typeof globalThis & {
  liveblocks?: Liveblocks
}

const liveblocks: Liveblocks = globalForLiveblocks.liveblocks ?? createLiveblocksClient()

if (process.env.NODE_ENV !== "production") {
  globalForLiveblocks.liveblocks = liveblocks
}

export { getCursorColor, liveblocks }

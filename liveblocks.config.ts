/**
 * Shared Liveblocks types for every room in the app. Augmenting the global
 * `Liveblocks` interface (the mechanism `@liveblocks/core` exposes for this)
 * is what lets `@liveblocks/client`, `@liveblocks/react`, and
 * `@liveblocks/node` all resolve the same Presence and UserMeta shapes
 * without generics being threaded through every call site.
 *
 * `thinking`, not the `isThinking` spec 10 names: specs 19 and 24 both define
 * presence with `thinking`, and spec 10 is implemented first — see the
 * "Presence field name conflicts" entry in `progress-tracker.md`.
 */
/**
 * A `type`, not an `interface`: `RoomProvider`'s `initialPresence` requires
 * `Presence extends JsonObject`, and TypeScript only satisfies that structural
 * check for a plain object type — an `interface` (open to declaration
 * merging) fails it even with identical members.
 */
type Presence = {
  cursor: { x: number; y: number } | null
  thinking: boolean
}

/**
 * `info` is set once, at session creation in `POST /api/liveblocks-auth`, and
 * from then on is read-only for every client in the room via `other.info`.
 */
type UserMeta = {
  id: string
  info: {
    name: string
    avatar: string
    color: string
  }
}

declare global {
  interface Liveblocks {
    Presence: Presence
    UserMeta: UserMeta
  }
}

export type { Presence, UserMeta }

import { forbidden, invalidRequest, unauthorized } from "@/lib/api-response"
import { getCursorColor, liveblocks } from "@/lib/liveblocks"
import { getCurrentUserProfile, getProjectAccess } from "@/lib/project-access"
import { parseRoomId, readJsonObject } from "@/lib/project-input"

/**
 * `POST /api/liveblocks-auth` — issues a Liveblocks session token scoped to
 * one project's room.
 *
 * The Liveblocks client (`authEndpoint` as a string, see spec 11) posts
 * `{ room }` here itself; the room ID is the project's cuid (the room-ID
 * decision in `progress-tracker.md`). Unlike the workspace page, a 403 here
 * does not leak project existence to a stranger — the caller already knows
 * the room ID, because it is the project they were trying to open.
 */
export async function POST(request: Request): Promise<Response> {
  const profile = await getCurrentUserProfile()

  if (!profile) {
    return unauthorized()
  }

  const body = await readJsonObject(request)

  if (!body.ok) {
    return invalidRequest(body.message)
  }

  const roomId = parseRoomId(body.value.room)

  if (!roomId.ok) {
    return invalidRequest(roomId.message)
  }

  const project = await getProjectAccess(roomId.value, profile)

  if (!project) {
    return forbidden("You do not have access to this project.")
  }

  // No public access: every permission comes from the session below, granted
  // only after the membership check above.
  await liveblocks.getOrCreateRoom(roomId.value, { defaultAccesses: [] })

  const session = liveblocks.prepareSession(profile.userId, {
    userInfo: {
      name: profile.name,
      avatar: profile.imageUrl,
      color: getCursorColor(profile.userId),
    },
  })

  session.allow(roomId.value, ["room:write"])

  const { status, body: responseBody } = await session.authorize()

  return new Response(responseBody, {
    status,
    headers: { "Content-Type": "application/json" },
  })
}

import "server-only"

import { z } from "zod"

/**
 * Every server-side variable the app reads. Later specs add theirs here; a
 * variable that only one optional feature needs is `.optional()` and checked
 * where it is used.
 */
const requiredServerEnvValue = z.string().refine((value) => value.trim().length > 0)

const serverEnvSchema = z.object({
  DATABASE_URL: requiredServerEnvValue,
  LIVEBLOCKS_SECRET_KEY: requiredServerEnvValue,
  CLERK_SECRET_KEY: requiredServerEnvValue,
  NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY: requiredServerEnvValue,
})

type ServerEnv = z.infer<typeof serverEnvSchema>

/**
 * Validates an environment source. The error names every missing or invalid
 * variable at once and never includes a value, since values are secrets.
 */
function parseServerEnv(source: Record<string, string | undefined>): ServerEnv {
  const result = serverEnvSchema.safeParse(source)

  if (result.success) {
    return result.data
  }

  const names = [...new Set(result.error.issues.map((issue) => String(issue.path[0])))]

  throw new Error(
    `Missing or invalid environment variables: ${names.join(", ")}. ` +
      "Set them in .env.local (see .env.example).",
  )
}

let cachedEnv: ServerEnv | undefined

/**
 * The validated server environment, parsed on first call and cached after.
 *
 * Deliberately a function rather than a top-level constant: `next build`
 * imports route modules without the full environment, so validation must wait
 * until something actually needs a variable.
 */
function getServerEnv(): ServerEnv {
  cachedEnv ??= parseServerEnv(process.env)

  return cachedEnv
}

export type { ServerEnv }
export { getServerEnv, parseServerEnv }

import { clerkMiddleware, createRouteMatcher } from "@clerk/nextjs/server"

const isPublicRoute = createRouteMatcher([
  "/",
  `${process.env.NEXT_PUBLIC_CLERK_SIGN_IN_URL ?? "/sign-in"}(.*)`,
  `${process.env.NEXT_PUBLIC_CLERK_SIGN_UP_URL ?? "/sign-up"}(.*)`,
])

/**
 * `app/api` authenticates inside each handler so it can answer `401`/`403` as
 * JSON. `auth.protect()` cannot: for a non-page request it answers `404`, which
 * would mask every unauthenticated API call as a missing route.
 */
const isApiRoute = createRouteMatcher(["/api/(.*)"])

export default clerkMiddleware(async (auth, req) => {
  if (!isPublicRoute(req) && !isApiRoute(req)) {
    await auth.protect()
  }
})

export const config = {
  matcher: [
    "/((?!_next|[^?]*\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)",
    "/(api|trpc)(.*)",
  ],
}

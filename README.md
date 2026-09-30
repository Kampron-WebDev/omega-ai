This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app).

## Getting Started

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## Development

### Environment variables

Copy `.env.example` to `.env.local` and fill in every value. The file comments say where each one comes from.

| Variable | Used for |
| --- | --- |
| `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY` | Clerk, in the browser |
| `CLERK_SECRET_KEY` | Clerk, on the server |
| `NEXT_PUBLIC_CLERK_SIGN_IN_URL`, `NEXT_PUBLIC_CLERK_SIGN_UP_URL` | Optional auth page paths (default `/sign-in`, `/sign-up`) |
| `DATABASE_URL` | PostgreSQL through Prisma |
| `LIVEBLOCKS_SECRET_KEY` | Liveblocks room auth and server access |

Server code reads variables only through `getServerEnv()` in `lib/env.ts`. It validates them on first use and throws one error naming every missing variable.

### Checks

```bash
npm run check   # lint, typecheck, and unit tests
npm run build   # production build
```

`npm test` runs Vitest once and `npm run test:watch` keeps it running. Tests sit next to the module they cover (`lib/slug.test.ts`) and never touch a database or the network. Hook and component tests opt into a browser-like environment with a `// @vitest-environment jsdom` header.

### Continuous integration

`.github/workflows/ci.yml` runs on pushes to `development` and `main` and on pull requests, on Node 24.

- **check:** `npm ci`, lint, typecheck, and tests. It also runs `npm audit` for production dependencies, which reports but does not fail the job yet.
- **build:** `npm run build`, using the `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY`, `CLERK_SECRET_KEY`, and `LIVEBLOCKS_SECRET_KEY` repository secrets. If any of them is missing, the job skips the build and leaves a notice that says which ones.

CI uses a placeholder `DATABASE_URL`, because `prisma generate` needs one during install but never connects.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.
# omega-ai

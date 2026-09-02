import { config as loadEnv } from "dotenv";
import { defineConfig } from "prisma/config";

// Prisma 7 does not load `.env*` files on its own, and Next.js keeps this
// project's variables in `.env.local`. Load the same files Next.js does, in the
// same precedence order, so the CLI and the running app always agree on
// `DATABASE_URL`.
for (const path of [".env.local", ".env"]) {
  loadEnv({ path, quiet: true });
}

export default defineConfig({
  schema: "prisma",
  migrations: {
    path: "prisma/migrations",
  },
  datasource: {
    url: process.env.DATABASE_URL,
  },
});

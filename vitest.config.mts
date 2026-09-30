import { fileURLToPath } from "node:url"

import { configDefaults, defineConfig } from "vitest/config"

export default defineConfig({
  resolve: {
    // Resolves the `@/` imports from tsconfig.json.
    tsconfigPaths: true,
    alias: {
      // `server-only` throws unless resolved with the `react-server`
      // condition, which Next.js sets and Vitest does not. Point it at the
      // package's own no-op entry so server modules can be tested directly.
      "server-only": fileURLToPath(
        new URL("./node_modules/server-only/empty.js", import.meta.url),
      ),
    },
  },
  test: {
    // Hook and component tests opt in with a `// @vitest-environment jsdom`
    // header; everything else is plain logic and runs in Node.
    environment: "node",
    include: ["**/*.test.{ts,tsx}"],
    exclude: [...configDefaults.exclude, ".next/**", "generated/**"],
  },
})

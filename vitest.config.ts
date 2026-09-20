import { defineConfig } from "vitest/config";
import path from "node:path";

export default defineConfig({
  test: {
    environment: "node",
    include: ["tests/**/*.test.ts"],
    // Headroom for cold imports under parallel runners.
    testTimeout: 30_000,
    // scratch/ holds reference checkouts (scandihaven, fitness-studio-new) —
    // never picked up by this project's test run
    exclude: ["node_modules/**", "scratch/**", "skills/**", "docs/**", "backup/**", ".next/**"],
    coverage: {
      provider: "v8",
      // The pure seam (PAD §7.3): zero-dependency domain modules held to 100%.
      // Keep this list in sync with the PAD when modules move.
      include: [
        "src/lib/validation.ts",
        "src/lib/auth/password.ts",
        "src/lib/typewriter.ts",
        "src/lib/constellation.ts",
        "src/lib/menu-wheel.ts",
      ],
      thresholds: {
        statements: 100,
        branches: 100,
        functions: 100,
        lines: 100,
      },
    },
  },
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "src"),
    },
  },
});

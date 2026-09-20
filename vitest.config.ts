import { defineConfig } from 'vitest/config'

export default defineConfig({
  test: {
    include: ['tests/**/*.test.ts'],
    // scratch/ holds reference checkouts (scandihaven, fitness-studio-new) —
    // never picked up by this project's test run
    exclude: ['node_modules/**', 'scratch/**', 'skills/**', 'docs/**', 'backup/**', '.next/**'],
    coverage: {
      provider: 'v8',
      include: ['src/lib/domain/**'],
      // The pure seam is held to 100% by convention (PAD §7.3) — enforce it.
      thresholds: {
        statements: 100,
        branches: 100,
        functions: 100,
        lines: 100,
      },
    },
  },
})

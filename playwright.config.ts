import { defineConfig, devices } from "@playwright/test";

/**
 * E2E config for the Designer Portfolio (Next.js 16 App Router, SQLite).
 *
 * Defaults target an already-running server on :3000 (reuseExisting),
 * because this workspace manages the server out-of-band. CI or a fresh
 * machine can set E2E_START=1 to have Playwright boot its own server, or
 * E2E_BASE_URL to point at any existing deployment.
 *
 * Only Chromium is configured: it is the only browser runtime installed in
 * this environment. The suites exercise real flows against the real SQLite
 * database (seeded via `bun run db:seed`), so tests that mutate data (inquiry
 * submission, project CRUD) are order-tolerant and use unique payloads.
 *
 * MEMORY NOTE: on a small host (< ~6 GB RAM, no swap) the Turbopack dev
 * server (~2.3 GB RSS) + Chromium (~2 GB) exceed the budget and the kernel
 * OOM-kills the server mid-run (observed). Run the suite against a
 * production server in that case — it needs a fraction of the memory:
 *   bun run build && E2E_START=1 E2E_COMMAND="bun run start" bunx playwright test
 *
 * Env:
 *   E2E_PORT     — port for the managed webServer (default 3000)
 *   E2E_BASE_URL — reuse an external server instead of starting one
 *   E2E_START    — set to "1" to let Playwright start the server itself
 *   E2E_COMMAND  — server command for the managed webServer
 *                  (default "bun run dev"; use "bun run start" after a build)
 */
const PORT = Number(process.env.E2E_PORT ?? 3000);
const baseURL = process.env.E2E_BASE_URL ?? `http://127.0.0.1:${PORT}`;
const startServer = process.env.E2E_START === "1";
const command = process.env.E2E_COMMAND ?? `bun run dev -- --port ${PORT}`;
// Remote-origin runs (E2E_BASE_URL → live smoke) need navigation headroom:
// a cross-Atlantic page.goto can exceed the 30s default under load, which
// flaked the mobile-overflow sweep on jesspete.shop (session 30). Local
// runs keep the framework default — this only relaxes remote-origin timing.
const isRemoteOrigin = Boolean(process.env.E2E_BASE_URL);

export default defineConfig({
  testDir: "./e2e",
  timeout: 30_000,
  expect: { timeout: 7_000 },
  fullyParallel: false,
  retries: 0,
  reporter: [["list"], ["html", { open: "never" }]],
  use: {
    baseURL,
    trace: "on-first-retry",
    screenshot: "only-on-failure",
    navigationTimeout: isRemoteOrigin ? 90_000 : undefined,
  },
  projects: [{ name: "chromium", use: { ...devices["Desktop Chrome"] } }],
  webServer: startServer
    ? {
        command,
        url: baseURL,
        reuseExistingServer: true,
        timeout: 120_000,
      }
    : undefined,
});

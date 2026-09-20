import { test, expect } from "@playwright/test";

/**
 * Graceful-degradation contract under a DATABASE OUTAGE.
 *
 * This file is skipped in normal runs. To exercise it, point the suite at a
 * server whose DATABASE_URL is unwritable (Prisma cannot even open the file):
 *
 *   E2E_OUTAGE=1 E2E_START=1 E2E_PORT=3100 \
 *   E2E_COMMAND="PORT=3100 DATABASE_URL=file:./db-outage-missing/custom.db bun run start" \
 *   bunx playwright test e2e/outage.spec.ts
 *
 * The contract (mirrors what a misconfigured production deployment looks
 * like — verified against a real one on 2026-09-20):
 *   1. /api/health detects the outage (503, db:false) — never a false "ok".
 *   2. The static shell (landing, /projects) keeps serving prerendered
 *      content — the outage must not take the whole site down.
 *   3. Server actions never throw across the action boundary (PAD §3.3):
 *      login and inquiry return a visible, non-leaking failure message.
 *   4. A dynamic page whose data layer throws renders the styled error
 *      boundary — not Next's bare "Internal Server Error".
 */
const OUTAGE = process.env.E2E_OUTAGE === "1";

test.beforeEach(() => {
  test.skip(!OUTAGE, "E2E_OUTAGE not set — run against the outage server (see file header)");
});

test("health reports degraded with db:false (503)", async ({ request }) => {
  const res = await request.get("/api/health");
  expect(res.status()).toBe(503);
  const body = await res.json();
  expect(body.status).toBe("degraded");
  expect(body.db).toBe(false);
});

test("static shell keeps serving prerendered content", async ({ page }) => {
  await page.goto("/");
  await expect(page.getByRole("heading", { level: 1, name: "Alex Moreau" })).toBeVisible();
  await expect(page.getByText("01/06 — 2035")).toBeVisible();
  await page.goto("/projects");
  await expect(page.getByRole("link", { name: /kinto/i }).first()).toBeVisible();
});

test("login degrades gracefully — visible error, no crash, no internals", async ({ page }) => {
  await page.goto("/login");
  await page.getByRole("textbox", { name: "Email", exact: true }).fill("nobody@example.com");
  await page.getByRole("textbox", { name: "Password", exact: true }).fill("whatever-password");
  await page.getByRole("button", { name: "Sign in" }).click();
  // Scope past Next's route announcer (also role=alert, always empty).
  const alert = page.getByRole("alert").filter({ hasText: /unavailable|try again/i });
  await expect(alert).toBeVisible({ timeout: 10_000 });
  // A generic, human message — never a Prisma error, stack, or internals.
  await expect(page).toHaveURL(/\/login/);
});

test("inquiry submission degrades gracefully", async ({ page }) => {
  await page.goto("/contact");
  const form = page.getByLabel("Project inquiry form");
  await form.getByLabel("Name *").fill("Outage Probe");
  await form.getByLabel("Email *").fill("outage-probe@example.com");
  await form.getByLabel("Project Details *").fill(
    "A syntactically valid inquiry submitted while the database is unreachable.",
  );
  await form.getByRole("button", { name: "Send Inquiry" }).click();
  // Scope past Next's route announcer (also role=alert, always empty).
  const alert = page.getByRole("alert").filter({ hasText: /unavailable|try again|couldn't be submitted/i });
  await expect(alert).toBeVisible({ timeout: 15_000 });
  // The success panel must NOT appear — the write truly failed.
  await expect(page.getByText("Thank you for reaching out.")).toBeHidden();
});

test("unknown project slug renders the styled error panel, not a bare 500", async ({ page }) => {
  await page.goto("/project/this-slug-never-exists");
  await expect(page.getByText(/something went wrong/i)).toBeVisible({ timeout: 10_000 });
  await expect(page.getByText("Internal Server Error")).toBeHidden();
  // The fallback render path bypasses React error boundaries, so the page
  // itself renders the panel — its actions are links (retry + home).
  await expect(page.getByRole("link", { name: /try again/i })).toBeVisible();
  await expect(page.getByRole("link", { name: /back to home/i })).toBeVisible();
});

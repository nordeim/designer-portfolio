import { test, expect } from "@playwright/test";

/**
 * Inquiry submission flow: the public contact form persists to the
 * dashboard inbox (login required), and status triage works.
 */

const EMAIL = process.env.E2E_ADMIN_EMAIL ?? "admin@alexmoreau.design";
const PASSWORD = process.env.E2E_ADMIN_PASSWORD ?? "";

test("inquiry validation shows only the destructive toast (source parity)", async ({ page }) => {
  await page.goto("/contact");
  const form = page.getByLabel("Project inquiry form");
  await form.getByLabel("Name *").fill("E2E Client");
  await form.getByLabel("Email *").fill("e2e-client@example.com");
  await form.getByLabel("Project Details *").fill("too short");
  await form.getByRole("button", { name: "Send Inquiry" }).click();

  // The reference renders ONLY a persistent solid-red system toast —
  // bg-destructive (#EF4444) with white text, no per-field inline errors.
  // Colors are canvas-normalized (Tailwind v4 emits oklab() computed strings).
  const toast = page.getByRole("alert").filter({ hasText: "Please fill in all required fields." });
  await expect(toast).toBeVisible({ timeout: 7_000 });
  const bg = await toast.evaluate((el) => {
    const cv = document.createElement("canvas");
    cv.width = cv.height = 1;
    const ctx = cv.getContext("2d");
    if (!ctx) throw new Error("no canvas context");
    ctx.fillStyle = getComputedStyle(el).backgroundColor;
    ctx.fillRect(0, 0, 1, 1);
    const d = ctx.getImageData(0, 0, 1, 1).data;
    return [d[0], d[1], d[2]];
  });
  expect(bg).toEqual([239, 68, 68]);
  const radius = await toast.evaluate((el) => getComputedStyle(el).borderRadius);
  expect(radius).toBe("0px");

  // Reachability (the toBeVisible blind spot): the toast must sit INSIDE the
  // viewport — a transformed ancestor (the form's FadeIn wrapper) would
  // re-anchor position:fixed and push it below the fold. Settle the entrance
  // animation first (it slides in from below).
  await page.waitForTimeout(400);
  const box = await toast.boundingBox();
  expect(box).not.toBeNull();
  expect(box!.x).toBeGreaterThanOrEqual(0);
  expect(box!.x + box!.width).toBeLessThanOrEqual(1280);
  expect(box!.y).toBeGreaterThanOrEqual(0);
  expect(box!.y + box!.height).toBeLessThanOrEqual(720);

  // No per-field inline error text renders (the source shows none).
  await expect(form.getByText(/min\. 20 characters/i)).toHaveCount(0);
  await expect(form.getByText("Please select a project type")).toHaveCount(0);
  await expect(form.getByText("Please select a budget range")).toHaveCount(0);
  await expect(form.getByText("Please select a timeline")).toHaveCount(0);

  // The toast persists (the reference's toasts never auto-dismiss).
  await page.waitForTimeout(6_000);
  await expect(toast).toBeVisible();
});

test("inquiry submits and appears in the dashboard inbox", async ({ page }) => {
  test.skip(!PASSWORD, "E2E_ADMIN_PASSWORD not provided");
  const stamp = Date.now();
  const name = `E2E Client ${stamp}`;

  await page.goto("/contact");
  const form = page.getByLabel("Project inquiry form");
  await form.getByLabel("Name *").fill(name);
  await form.getByLabel("Email *").fill(`e2e-${stamp}@example.com`);
  await form.getByLabel("Company").fill("E2E Test Co");
  // The form starts with empty selects (source parity) — pick real values
  // through the Radix UI exactly like a visitor would.
  await form.getByRole("combobox", { name: "Project Type" }).click();
  await page.getByRole("option", { name: "Brand Identity", exact: true }).click();
  await form.getByRole("combobox", { name: "Budget Range" }).click();
  await page.getByRole("option", { name: "$10K – $25K", exact: true }).click();
  await form.getByRole("combobox", { name: "Timeline" }).click();
  await page.getByRole("option", { name: "1 – 2 months", exact: true }).click();
  await form.getByLabel("Project Details *").fill(
    "End-to-end inquiry submitted by the Playwright suite to verify the public form persists into the owner dashboard inbox.",
  );
  await form.getByRole("button", { name: "Send Inquiry" }).click();
  await expect(form.getByText("Thank you for reaching out.")).toBeVisible({ timeout: 15_000 });

  // Source-parity success toast (session 22): a persistent light system
  // toast — bg-background (#F6F6F6) — alongside the confirmation panel.
  // (The toast root is roleless for the success variant — Radix mirrors it
  // into its own aria-live announcer — so we locate it structurally.)
  const toast = page.locator("ol > li").filter({ hasText: "Inquiry sent successfully." });
  await expect(toast).toBeVisible();
  const bg = await toast.evaluate((el) => {
    const cv = document.createElement("canvas");
    cv.width = cv.height = 1;
    const ctx = cv.getContext("2d");
    if (!ctx) throw new Error("no canvas context");
    ctx.fillStyle = getComputedStyle(el).backgroundColor;
    ctx.fillRect(0, 0, 1, 1);
    const d = ctx.getImageData(0, 0, 1, 1).data;
    return [d[0], d[1], d[2]];
  });
  expect(bg).toEqual([246, 246, 246]);

  // Sign in and confirm it landed in the inbox.
  await page.goto("/login");
  await page.getByRole("textbox", { name: "Email", exact: true }).fill(EMAIL);
  await page.getByRole("textbox", { name: "Password", exact: true }).fill(PASSWORD);
  await page.getByRole("button", { name: "Sign in" }).click();
  await expect(page).toHaveURL(/\/dashboard/, { timeout: 15_000 });

  await page.goto("/dashboard/inquiries");
  await expect(page.getByText(name)).toBeVisible({ timeout: 10_000 });
});

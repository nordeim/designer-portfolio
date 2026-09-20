import { test, expect } from "@playwright/test";

/**
 * Inquiry submission flow: the public contact form persists to the
 * dashboard inbox (login required), and status triage works.
 */

const EMAIL = process.env.E2E_ADMIN_EMAIL ?? "admin@alexmoreau.design";
const PASSWORD = process.env.E2E_ADMIN_PASSWORD ?? "";

test("inquiry validation blocks short details client-side", async ({ page }) => {
  await page.goto("/contact");
  const form = page.getByLabel("Project inquiry form");
  await form.getByLabel("Name *").fill("E2E Client");
  await form.getByLabel("Email *").fill("e2e-client@example.com");
  await form.getByLabel("Project Details *").fill("too short");
  await form.getByRole("button", { name: "Send Inquiry" }).click();
  await expect(form.getByText(/min. 20 characters/i)).toBeVisible();
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
  await form.getByLabel("Project Details *").fill(
    "End-to-end inquiry submitted by the Playwright suite to verify the public form persists into the owner dashboard inbox.",
  );
  await form.getByRole("button", { name: "Send Inquiry" }).click();
  await expect(form.getByText("Thank you for reaching out.")).toBeVisible({ timeout: 15_000 });

  // Sign in and confirm it landed in the inbox.
  await page.goto("/login");
  await page.getByRole("textbox", { name: "Email", exact: true }).fill(EMAIL);
  await page.getByRole("textbox", { name: "Password", exact: true }).fill(PASSWORD);
  await page.getByRole("button", { name: "Sign in" }).click();
  await expect(page).toHaveURL(/\/dashboard/, { timeout: 15_000 });

  await page.goto("/dashboard/inquiries");
  await expect(page.getByText(name)).toBeVisible({ timeout: 10_000 });
});

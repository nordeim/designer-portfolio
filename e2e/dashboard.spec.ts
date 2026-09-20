import { test, expect } from "@playwright/test";

/**
 * Owner dashboard: stats overview, projects CRUD round-trip, inquiry
 * triage workflow, and sign-out. Requires E2E_ADMIN_PASSWORD.
 */

const EMAIL = process.env.E2E_ADMIN_EMAIL ?? "admin@alexmoreau.design";
const PASSWORD = process.env.E2E_ADMIN_PASSWORD ?? "";

test.beforeEach(async ({ page }) => {
  test.skip(!PASSWORD, "E2E_ADMIN_PASSWORD not provided");
  await page.goto("/login");
  await page.getByRole("textbox", { name: "Email", exact: true }).fill(EMAIL);
  await page.getByRole("textbox", { name: "Password", exact: true }).fill(PASSWORD);
  await page.getByRole("button", { name: "Sign in" }).click();
  await expect(page).toHaveURL(/\/dashboard/, { timeout: 15_000 });
});

test("overview shows stats and recent inquiries", async ({ page }) => {
  await expect(page.getByRole("heading", { name: /Studio dashboard/i })).toBeVisible();
  // Stat cards live outside the sidebar nav — scope to the card grid.
  const statsGrid = page.locator("div.grid.grid-cols-2").first();
  await expect(statsGrid.getByText("PROJECTS")).toBeVisible();
  await expect(statsGrid.getByText("INQUIRIES")).toBeVisible();
  await expect(page.getByLabel("Recent inquiries")).toBeVisible();
});

test("sidebar navigation reaches projects and inquiries managers", async ({ page }) => {
  const nav = page.getByLabel("Dashboard navigation");
  await nav.getByRole("link", { name: "Projects" }).click();
  await expect(page).toHaveURL(/\/dashboard\/projects/);
  await expect(page.getByRole("heading", { name: "Projects", exact: true })).toBeVisible();
  await nav.getByRole("link", { name: "Inquiries" }).click();
  await expect(page).toHaveURL(/\/dashboard\/inquiries/);
  await expect(page.getByRole("button", { name: "New project" })).toBeHidden();
});

test("projects CRUD round-trip: create, verify on public site, delete", async ({ page }) => {
  const stamp = Date.now();
  const title = `E2E Project ${stamp}`;
  const slug = `e2e-project-${stamp}`;

  await page.goto("/dashboard/projects");
  await page.getByRole("button", { name: "New project" }).click();
  const dialog = page.getByRole("dialog");
  await expect(dialog).toBeVisible();
  await dialog.getByRole("textbox", { name: "Title *", exact: true }).fill(title);
  await dialog.getByRole("textbox", { name: "Slug *", exact: true }).fill(slug);
  await dialog.getByRole("textbox", { name: "Subtitle *", exact: true }).fill("E2E temporary project");
  await dialog.getByRole("textbox", { name: "Role *", exact: true }).fill("Brand Designer");
  await dialog.getByRole("textbox", { name: "Year *", exact: true }).fill("2036");
  await dialog.getByRole("textbox", { name: "Category *", exact: true }).fill("Branding");
  await dialog.getByRole("textbox", { name: "Tagline *", exact: true }).fill("Temporary");
  await dialog.getByRole("textbox", { name: "Hero image path *", exact: true }).fill(`/projects/${slug}/hero.jpg`);
  await dialog.getByRole("textbox", { name: "Cover image path *", exact: true }).fill(`/projects/${slug}/cover.jpg`);
  await dialog.getByRole("textbox", { name: "Objective *", exact: true }).fill("Temporary objective created by the e2e suite.");
  await dialog.getByRole("textbox", { name: "Description *", exact: true }).fill("A temporary project created by the e2e suite to verify CRUD flows end-to-end.");
  await dialog.getByRole("textbox", { name: "Problem *", exact: true }).fill("Temporary problem statement for e2e verification purposes.");
  await dialog.getByRole("textbox", { name: "Solution *", exact: true }).fill("Temporary solution statement for e2e verification purposes.");
  await dialog.getByRole("textbox", { name: "Process *", exact: true }).fill("Temporary process narrative for e2e verification purposes.");
  await dialog.getByRole("button", { name: "Create project" }).click();
  await expect(page.getByText(title)).toBeVisible({ timeout: 15_000 });

  // It appears on the public archive (server action revalidated the page).
  // Generous timeout: under full-suite load the SSG revalidation of /projects
  // can take longer than the default budget (observed in CI-style runs).
  await page.goto("/projects");
  await expect(page.getByText(title)).toBeVisible({ timeout: 20_000 });

  // Delete it again — dashboard row action.
  await page.goto("/dashboard/projects");
  // Scope to non-toast list items: Sonner renders success toasts (e.g.
  // `Deleted "<title>".`) as <li> elements too, so an unscoped locator
  // races the toast's mount window and fails with a strict-mode violation
  // (2 elements) instead of waiting for the row to disappear.
  const row = page.locator("li:not([data-sonner-toast])").filter({ hasText: title });
  await row.getByRole("button", { name: "Delete" }).click();
  await row.getByRole("button", { name: "Confirm delete" }).click();
  await expect(row).toBeHidden({ timeout: 15_000 });
});

test("inquiry triage: status transitions persist", async ({ page }) => {
  // Self-sufficient: a pristine database seeds no inquiries, so the spec
  // submits its own before triaging (the public form persists straight to
  // the owner inbox). Scoping to the submitted row also avoids depending
  // on list ordering or rows left over from earlier runs.
  const stamp = Date.now();
  const name = `E2E Triage ${stamp}`;

  await page.goto("/contact");
  const form = page.getByLabel("Project inquiry form");
  await form.getByLabel("Name *").fill(name);
  await form.getByLabel("Email *").fill(`e2e-triage-${stamp}@example.com`);
  // The form starts with empty selects (source parity) — pick values first.
  await form.getByRole("combobox", { name: "Project Type" }).click();
  await page.getByRole("option", { name: "Brand Identity", exact: true }).click();
  await form.getByRole("combobox", { name: "Budget Range" }).click();
  await page.getByRole("option", { name: "$10K – $25K", exact: true }).click();
  await form.getByRole("combobox", { name: "Timeline" }).click();
  await page.getByRole("option", { name: "1 – 2 months", exact: true }).click();
  await form.getByLabel("Project Details *").fill(
    "Inquiry submitted by the triage spec so the status-transition flow can be verified against a guaranteed row.",
  );
  await form.getByRole("button", { name: "Send Inquiry" }).click();
  await expect(form.getByText("Thank you for reaching out.")).toBeVisible({ timeout: 15_000 });

  await page.goto("/dashboard/inquiries");
  const row = page.locator("li:not([data-sonner-toast])").filter({ hasText: name });
  await expect(row).toBeVisible({ timeout: 10_000 });
  // Fresh inquiries start as NEW; flip to READ and confirm the trigger
  // reflects it (the value is server-persisted).
  const combobox = row.getByRole("combobox", { name: `Status for ${name}` });
  await combobox.click();
  await page.getByRole("option", { name: "READ", exact: true }).click();
  await expect(combobox).toContainText("READ", { timeout: 10_000 });
});

test("sign out returns to the public site", async ({ page }) => {
  await page.getByRole("button", { name: /sign out/i }).click();
  await expect(page).toHaveURL(/\/login|\/$/, { timeout: 10_000 });
});

import { test, expect } from "@playwright/test";

/**
 * Public surface: every route renders with the reference app's content and
 * chrome. Runs against the dev server (see playwright.config.ts).
 */

test("landing renders the hero, works index, philosophy, and footer marquee", async ({ page }) => {
  await page.goto("/");
  await expect(page).toHaveTitle("Designer Portfolio");

  // Header chrome: breathing logo, menu button, fixed corner CTA.
  await expect(page.getByRole("link", { name: "Alex Moreau — home" })).toBeVisible();
  await expect(page.getByRole("button", { name: "Open menu" })).toBeVisible();
  await expect(page.getByRole("link", { name: "Start a Project →" })).toBeVisible();

  // Hero name + typewriter meta line.
  await expect(page.getByRole("heading", { level: 1, name: "Alex Moreau" })).toBeVisible();
  await expect(page.getByText("GRAPHIC DESIGNER")).toBeVisible({ timeout: 10_000 });

  // Selected Works: 3 rows with the reference's hardcoded 06 denominator.
  const works = page.getByLabel("Selected Works");
  await expect(works.getByText("01/06 — 2035").first()).toBeVisible();
  await expect(works.getByRole("heading", { name: "Kinto" })).toBeVisible();
  await expect(works.getByRole("heading", { name: "The Blue Shift" })).toBeVisible();
  await expect(works.getByRole("heading", { name: "ST.Lab" })).toBeVisible();
  await expect(works.getByRole("link", { name: /All Projects →/ })).toBeVisible();

  // Philosophy statement + underlined links.
  await expect(page.getByLabel("Design Philosophy").getByText(/design is not decoration/)).toBeVisible();
  await expect(page.getByRole("link", { name: "Read My Story →" })).toBeVisible();
  await expect(page.getByRole("link", { name: "Start a Conversation →" })).toBeVisible();

  // Footer: ghost marquee + columns + copyright line.
  const footer = page.getByRole("contentinfo");
  await expect(footer.locator(".marquee-track")).toBeVisible();
  await expect(footer.getByRole("heading", { name: "Navigation" })).toBeVisible();
  await expect(footer.getByText("© 2026 Alex Moreau. Built on Base44.")).toBeVisible();
});

test("project archive lists all published projects with numbering", async ({ page }) => {
  await page.goto("/projects");
  await expect(page.getByRole("heading", { level: 1, name: "Projects" })).toBeVisible();
  for (const title of ["Kinto", "The Blue Shift", "ST.Lab", "Squeez'd", "Vexta"]) {
    await expect(page.getByRole("link", { name: new RegExp(title) }).first()).toBeVisible();
  }
  await expect(page.getByText("05").first()).toBeVisible();
});

test("about page renders the portrait, timeline, and proficiency matrix", async ({ page }) => {
  await page.goto("/about");
  await expect(page.getByRole("heading", { level: 1, name: /Brands that mean something/ })).toBeVisible();
  await expect(page.getByAltText("Alex Moreau — portrait")).toBeVisible();
  await expect(page.getByRole("heading", { name: "Experience & Education" })).toBeVisible();
  await expect(page.getByText("Independent Brand Studio")).toBeVisible();
  await expect(page.getByRole("heading", { name: "Software & Technical Proficiency" })).toBeVisible();
  // Sage dots mark the tool list.
  await expect(page.getByLabel("Technical proficiency").locator(".bg-sage").first()).toBeVisible();
});

test("contact page renders headline, underline form, FAQ, and info columns", async ({ page }) => {
  await page.goto("/contact");
  await expect(page.getByRole("heading", { level: 1, name: /remarkable together/ })).toBeVisible();
  await expect(page.getByLabel("Project inquiry form").getByLabel("Name *")).toBeVisible();
  await expect(page.getByLabel("Project inquiry form").getByRole("button", { name: "Send Inquiry" })).toBeVisible();
  await expect(page.getByText("hello@alexmoreau.design").first()).toBeVisible();
  await expect(page.getByLabel("Contact information").getByText("Berlin, Germany")).toBeVisible();
});

test("legal pages render", async ({ page }) => {
  await page.goto("/privacy");
  await expect(page.getByRole("heading", { name: /privacy/i }).first()).toBeVisible();
  await page.goto("/accessibility");
  await expect(page.getByRole("heading", { name: /accessibility/i }).first()).toBeVisible();
});

test("health endpoint reports ok", async ({ request }) => {
  const res = await request.get("/api/health");
  expect(res.status()).toBe(200);
  const body = await res.json();
  expect(body.status).toBe("ok");
  expect(body.db).toBe(true);
});

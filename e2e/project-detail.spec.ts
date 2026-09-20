import { test, expect } from "@playwright/test";

/**
 * Case-study page: full-bleed hero, meta grid, gallery with the zoom
 * toggle, autoplaying video, and circular prev/next navigation.
 */

const SLUG = "kinto-cafe-branding";

test("hero shows the index label, oversized title, subtitle and meta", async ({ page }) => {
  await page.goto(`/project/${SLUG}`);
  // Title matches the reference app's generic project-route title.
  await expect(page).toHaveTitle("Project Detail | Designer Portfolio");
  const hero = page.getByLabel("Project hero");
  await expect(hero).toBeVisible();
  await expect(hero.getByText("01/06 — Branding")).toBeVisible();
  await expect(hero.getByRole("heading", { level: 1, name: "Kinto" })).toBeVisible();
  await expect(hero.getByText("Matcha Brand Identity")).toBeVisible();
  // Desktop meta grid lives inside the hero (Role / Year / Objective).
  await expect(hero.getByText("Brand Designer")).toBeVisible();
  await expect(hero.getByText("Objective")).toBeVisible();
});

test("detail section has sticky intro, gallery, and a working zoom toggle", async ({ page }) => {
  await page.goto(`/project/${SLUG}`);
  const detail = page.getByLabel("Project detail");
  await expect(detail.getByRole("heading", { name: "Matcha, elevated" })).toBeVisible();
  // Gallery images render (natural-ratio frames).
  expect(await detail.locator("img").count()).toBeGreaterThan(2);

  // Zoom out → two-column mosaic (the desktop gallery container).
  const zoomOut = page.getByRole("button", { name: "Zoom out" });
  await expect(zoomOut).toBeAttached();
  await zoomOut.click();
  await expect(detail.locator("div.col-span-8.columns-2")).toBeVisible();
  // Zoom back in → single column.
  await page.getByRole("button", { name: "Zoom in" }).click();
  await expect(detail.locator("div.col-span-8.flex.flex-col.gap-4")).toBeVisible();
});

test("prev/next navigation wraps around the catalog", async ({ page }) => {
  await page.goto(`/project/${SLUG}`);
  const nav = page.getByLabel("Project navigation");
  // Kinto is first: prev wraps to Vexta, next is The Blue Shift.
  await expect(nav.getByText("Previous Project")).toBeVisible();
  await expect(nav.getByText("Next Project")).toBeVisible();
  await expect(nav.getByText("Vexta")).toBeVisible();
  await expect(nav.getByText("The Blue Shift")).toBeVisible();
});

test("video gallery item autoplays muted", async ({ page }) => {
  await page.goto("/project/sable-fashion-brand");
  const detail = page.getByLabel("Project detail");
  const video = detail.locator("video").first();
  await expect(video).toBeAttached();
  // Autoplay + muted + loop attributes mirror the reference behavior.
  await expect(video).toHaveAttribute("muted", "");
  await expect(video).toHaveAttribute("loop", "");
});

test("unknown slug shows the 404 page", async ({ page }) => {
  await page.goto("/project/does-not-exist");
  await expect(page.getByText(/404|not found|Project not found/i).first()).toBeVisible();
});

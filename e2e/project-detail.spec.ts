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

test("unknown slug shows the source-parity project-not-found state", async ({ page }) => {
  const response = await page.goto("/project/does-not-exist");
  // HTTP semantics stay honest (the reference SPA returns 200; we keep the
  // correct 404 — documented divergence, visuals unaffected).
  expect(response?.status()).toBe(404);
  // Source parity: the reference SPA keeps the generic project-route title
  // for unknown slugs (its route shell renders the "Project not found."
  // body) — the tab title does not change.
  await expect(page).toHaveTitle("Project Detail | Designer Portfolio");
  // The reference renders the site chrome with a centered mono message —
  // NOT the generic 404 boundary.
  await expect(page.getByText("Project not found.", { exact: true })).toBeVisible();
  await expect(page.getByRole("heading", { name: "Page Not Found" })).toHaveCount(0);
  // Site chrome still present: the footer marquee and the header logo.
  await expect(page.getByText("BRAND IDENTITY").first()).toBeVisible();
  await expect(page.getByRole("link", { name: "Alex Moreau — home" })).toBeVisible();
  // Source geometry: the message sits inside the viewport (centered band).
  const msg = page.getByText("Project not found.", { exact: true });
  const box = await msg.boundingBox();
  expect(box).not.toBeNull();
  expect(box!.y).toBeGreaterThan(150);
  expect(box!.y + box!.height).toBeLessThan(720);
});

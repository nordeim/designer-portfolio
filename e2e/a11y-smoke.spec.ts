import { test, expect } from "@playwright/test";

/**
 * Runtime hygiene: no console errors on the public routes, keyboard focus
 * is visible on the main interactive elements, and mobile layout holds.
 */

const ROUTES = ["/", "/projects", "/project/kinto-cafe-branding", "/about", "/contact", "/login"];

test("public pages log no console errors", async ({ page }) => {
  const errors: string[] = [];
  page.on("console", (msg) => {
    if (msg.type() === "error") errors.push(msg.text());
  });
  page.on("pageerror", (err) => errors.push(String(err)));

  for (const route of ROUTES) {
    await page.goto(route, { waitUntil: "domcontentloaded" });
  }
  // Give late errors (hydration, images) a beat to surface.
  await page.waitForTimeout(1500);
  expect(errors).toEqual([]);
});

test("keyboard focus is visible on primary controls", async ({ page }) => {
  await page.goto("/");
  const menu = page.getByRole("button", { name: "Open menu" });
  await menu.focus();
  await expect(menu).toBeFocused();
  // The focus ring is an outline/box-shadow — non-zero width.
  const outline = await menu.evaluate((el) => {
    const cs = getComputedStyle(el);
    return { width: cs.outlineWidth, style: cs.outlineStyle, shadow: cs.boxShadow, ring: cs.getPropertyValue("--tw-ring-shadow") };
  });
  const hasRing =
    (outline.style !== "none" && parseFloat(outline.width) > 0) ||
    outline.shadow !== "none" ||
    outline.ring.length > 0;
  expect(hasRing).toBe(true);
});

test("theme toggle switches the color scheme", async ({ page }) => {
  await page.goto("/");
  const html = page.locator("html");
  await expect(html).toHaveClass(/light|dark/);
  await page.getByRole("button", { name: "Toggle dark mode" }).click();
  await expect(html).not.toHaveClass(/light/);
  await expect(html).toHaveClass(/dark/);
});

test("mobile viewport has no horizontal overflow", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  for (const route of ["/", "/projects", "/about", "/contact"]) {
    await page.goto(route, { waitUntil: "domcontentloaded" });
    await page.waitForTimeout(800);
    const overflow = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
    expect(overflow, `${route} overflows by ${overflow}px`).toBeLessThanOrEqual(0);
  }
});

test("footer marquee track animates", async ({ page }) => {
  await page.goto("/");
  const track = page.getByRole("contentinfo").locator(".marquee-track");
  await expect(track).toBeVisible();
  const animation = await track.evaluate((el) => getComputedStyle(el).animationName);
  expect(animation).not.toBe("none");
});

test("hero constellation renders image slots and cobalt dots", async ({ page }) => {
  await page.goto("/");
  const hero = page.getByLabel("Introduction");
  // Dots are always present; images surface via cycling/hover.
  await expect(hero.locator(".bg-cobalt").first()).toBeVisible();
  const slots = await hero.locator("[class*='absolute z-20']").count();
  expect(slots).toBeGreaterThanOrEqual(8);
});

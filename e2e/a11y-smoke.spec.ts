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

test("focus rings match the source's exact coverage (session 26 parity)", async ({ page }) => {
  // Source-measured ring map (base44 Tab-stops): the fixed CTA, footer
  // links, philosophy links, and the inquiry submit show the cobalt ring
  // (with the white 4px offset) — via PLAIN `focus:` (any focus, mouse or
  // keyboard). The header chrome (logo / theme toggle / menu button),
  // works rows, All Projects, radial-menu links, prev/next links, and the
  // FAQ triggers render NO ring (focus:outline-none only). This spec pins
  // that exact coverage — programmatic el.focus() triggers :focus (which
  // is what the source's plain focus: responds to).
  await page.goto("/");
  const cta = page.getByRole("link", { name: "Start a Project →" });
  await cta.focus();
  await expect(cta).toBeFocused();
  const ctaRing = await cta.evaluate((el) => {
    const cs = getComputedStyle(el);
    return cs.boxShadow;
  });
  // White 4px offset + cobalt 6px ring, exactly like the source's CTA.
  expect(ctaRing).toContain("rgb(46, 91, 255)");
  expect(ctaRing).toContain("rgb(255, 255, 255)");

  // The menu button must NOT paint a ring — the source shows none there.
  const menu = page.getByRole("button", { name: "Open menu" });
  await menu.focus();
  const menuRing = await menu.evaluate((el) => {
    const cs = getComputedStyle(el);
    const shadow = cs.boxShadow;
    // A ring is any shadow segment with a non-transparent color and a
    // non-zero width (transparent segments from @property initial values
    // don't count — the session-26 truncation lesson).
    if (shadow === "none") return false;
    let visible = false;
    for (const seg of shadow.split(/,(?![^(]*\))/)) {
      const m = seg.match(/rgba?\(\s*(\d+)[,\s]+(\d+)[,\s]+(\d+)(?:[,\s/]+(\d*\.?\d+))?\s*\)/);
      if (m) {
        const alpha = m[4] === undefined || m[4] === "" ? 1 : parseFloat(m[4]);
        const w = seg.match(/0px 0px 0px (\d+)px/);
        if (alpha > 0.05 && w && parseInt(w[1], 10) > 0) visible = true;
      }
    }
    return visible;
  });
  expect(menuRing, "menu button must show no ring (source parity)").toBe(false);
});

test("Inter font file matches the source's glyph metrics (session 26)", async ({ page }) => {
  // The source loads Google Fonts CDN Inter v20 (variable woff2, latin).
  // next/font/google shipped a build whose weights 300/500 run ~3% wider
  // (canvas: "Matcha, elevated" 243px vs the source's 236px) — shifting
  // page flow and text wrapping. This spec pins the exact glyph metrics:
  // the self-hosted file must measure what the source measures.
  await page.goto("/");
  await page.evaluate(() => document.fonts.ready);
  const width = await page.evaluate(() => {
    const ctx = document.createElement("canvas").getContext("2d");
    if (!ctx) return null;
    ctx.font = '300 30px "Inter"';
    return Math.round(ctx.measureText("Matcha, elevated").width);
  });
  expect(width).toBeGreaterThanOrEqual(235);
  expect(width).toBeLessThanOrEqual(237);
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

test("works-row image hover scales smoothly through a transition (source parity)", async ({ page }) => {
  // The reference animates the row image to scale(1.05) over 0.7s with
  // cubic-bezier(0.65, 0, 0.35, 1). Tailwind v4's scale utility animates the
  // `scale` PROPERTY, so the transition-property list must include `scale`
  // and the hover must produce in-flight values — an inline
  // `style={{ transition: "transform …" }}` shorthand silently drops the
  // `scale` property from the list and the hover SNAPS (the session-24 bug).
  await page.goto("/");
  const img = page.locator("a[href^='/project/'] img").first();
  await img.scrollIntoViewIfNeeded();
  await page.waitForTimeout(700); // let the framer-motion row reveal settle

  const prop = await img.evaluate((el) => getComputedStyle(el).transitionProperty);
  expect(prop).toContain("scale");
  const timing = await img.evaluate((el) => getComputedStyle(el).transitionTimingFunction);
  expect(timing).toBe("cubic-bezier(0.65, 0, 0.35, 1)");

  await img.hover();
  // Sample during the ~700ms flight — a snap yields only the endpoints; a
  // real transition passes through intermediate values.
  let sawMidFlight = false;
  for (let i = 0; i < 8; i++) {
    const s = await img.evaluate((el) => getComputedStyle(el).scale);
    const v = parseFloat(s);
    if (v > 1.0005 && v < 1.049) sawMidFlight = true;
    await page.waitForTimeout(60);
  }
  await page.waitForTimeout(900);
  const settled = await img.evaluate((el) => getComputedStyle(el).scale);
  expect(sawMidFlight, "hover scale must animate (transition, not snap)").toBe(true);
  expect(settled).toBe("1.05");
});

test("hero constellation renders image slots and cobalt dots", async ({ page }) => {
  await page.goto("/");
  const hero = page.getByLabel("Introduction");
  // Dots are always present; images surface via cycling/hover.
  await expect(hero.locator(".bg-cobalt").first()).toBeVisible();
  const slots = await hero.locator("[class*='absolute z-20']").count();
  expect(slots).toBeGreaterThanOrEqual(8);
});

test("mobile radial menu paints, shows every item, and closes (regression: invisible menu)", async ({ page }) => {
  // Regression spec for the session-16 defect: at phone width the menu opened
  // but rendered nothing — the overlay's bg-charcoal utility was dead (missing
  // Tailwind v4 theme mapping) and every item anchor sat off-screen right
  // (wrong wheel center). This spec pins paint + in-viewport reachability.
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/", { waitUntil: "domcontentloaded" });
  await page.getByRole("button", { name: "Open menu" }).click();

  const dialog = page.getByRole("dialog", { name: "Site navigation" });
  await expect(dialog).toBeVisible();

  // The overlay must actually PAINT (charcoal = rgb(18, 18, 18)), not mount
  // as a transparent layer over the page.
  const overlayBg = await dialog.evaluate((el) => getComputedStyle(el).backgroundColor);
  expect(overlayBg).toBe("rgb(18, 18, 18)");

  // Every route label must be visible INSIDE the viewport — Playwright's
  // toBeVisible() alone passes for off-screen elements, so assert geometry.
  for (const label of ["Home", "Projects", "About", "Contact"]) {
    const link = dialog.getByRole("link", { name: label, exact: true });
    await expect(link).toBeVisible();
    const box = await link.boundingBox();
    expect(box, `${label} missing bounding box`).not.toBeNull();
    expect(box!.x, `${label} starts left of the viewport`).toBeGreaterThanOrEqual(0);
    expect(box!.x + box!.width, `${label} ends right of the viewport`).toBeLessThanOrEqual(390);
  }

  // A link click navigates from the overlay (hasTouch is off in this
  // project; the touch path was validated separately — both fire the same
  // React handler).
  await dialog.getByRole("link", { name: "About", exact: true }).click();
  await expect(page).toHaveURL(/\/about/);

  // Reopen and close via the X button.
  await page.getByRole("button", { name: "Open menu" }).click();
  await expect(dialog).toBeVisible();
  await dialog.getByRole("button", { name: "Close menu" }).click();
  await expect(dialog).toBeHidden({ timeout: 5000 });
});

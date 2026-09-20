/* Session-16 remediated screenshots: the radial menu now paints and positions
 * like the reference. Recaptures 12/16/05 (which documented the broken state)
 * and adds 23 (mobile projects submenu — full interaction proof).
 */
import { chromium } from "@playwright/test";

const OUT = "docs/screenshots";
const browser = await chromium.launch();

// 12 — mobile menu open (replaces the broken-state capture).
{
  const ctx = await browser.newContext({ viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true });
  const page = await ctx.newPage();
  await page.goto("http://localhost:3000/", { waitUntil: "domcontentloaded" });
  await page.waitForTimeout(1200);
  await page.touchscreen.tap(349, 40);
  await page.waitForTimeout(1500);
  await page.screenshot({ path: `${OUT}/12-mobile-menu.png` });
  await ctx.close();
}

// 23 — mobile menu with the projects submenu expanded.
{
  const ctx = await browser.newContext({ viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true });
  const page = await ctx.newPage();
  await page.goto("http://localhost:3000/", { waitUntil: "domcontentloaded" });
  await page.waitForTimeout(1200);
  await page.touchscreen.tap(349, 40);
  await page.waitForTimeout(1000);
  await page.getByRole("button", { name: "Toggle projects list" }).click();
  await page.waitForTimeout(800);
  await page.screenshot({ path: `${OUT}/23-mobile-menu-projects-submenu.png` });
  await ctx.close();
}

// 16 — desktop radial menu open with the projects submenu (replaces the
// broken-state capture; shows the wheel arc + item cluster at screen center).
{
  const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 } });
  const page = await ctx.newPage();
  await page.goto("http://localhost:3000/", { waitUntil: "domcontentloaded" });
  await page.waitForTimeout(1200);
  await page.getByRole("button", { name: "Open menu" }).click();
  await page.waitForTimeout(800);
  await page.getByRole("button", { name: "Toggle projects list" }).click();
  await page.waitForTimeout(800);
  // Hover a project to trigger the circular preview.
  const kinto = page.getByRole("dialog", { name: "Site navigation" }).getByRole("link", { name: /^Kinto/ });
  await kinto.hover().catch(() => {});
  await page.waitForTimeout(600);
  await page.screenshot({ path: `${OUT}/16-radial-menu.png` });
  await ctx.close();
}

// 05 — contact page (recaptured: the submit pill now paints charcoal).
{
  const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 } });
  const page = await ctx.newPage();
  await page.goto("http://localhost:3000/contact", { waitUntil: "domcontentloaded" });
  await page.waitForTimeout(2200);
  await page.screenshot({ path: `${OUT}/05-contact.png` });
  await ctx.close();
}

await browser.close();
console.log("screenshots captured");

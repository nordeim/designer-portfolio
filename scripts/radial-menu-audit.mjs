/* Verify the radial menu overlay paint + item positions at desktop AND mobile.
 * Usage: bun scripts/mobile-menu-probe3.mjs [origin]
 */
import { chromium } from "@playwright/test";

const origin = process.argv[2] || "http://localhost:3000";
const browser = await chromium.launch();

for (const vp of [{ name: "desktop", width: 1440, height: 900 }, { name: "mobile", width: 390, height: 844, isMobile: true, hasTouch: true }]) {
  const ctx = await browser.newContext({ viewport: { width: vp.width, height: vp.height }, isMobile: !!vp.isMobile, hasTouch: !!vp.hasTouch });
  const page = await ctx.newPage();
  await page.goto(origin, { waitUntil: "domcontentloaded", timeout: 45000 });
  await page.waitForTimeout(1000);
  await page.getByRole("button", { name: "Open menu" }).first().click();
  await page.waitForTimeout(1200); // let the 0.5s open animation finish

  const data = await page.evaluate(() => {
    const ov = document.querySelector('[role="dialog"][aria-label="Site navigation"]');
    if (!ov) return { overlay: "absent" };
    const cs = getComputedStyle(ov);
    const links = Array.from(ov.querySelectorAll("a")).map((a) => {
      const r = a.getBoundingClientRect();
      return { text: a.textContent?.trim().slice(0, 30), x: Math.round(r.x), y: Math.round(r.y), w: Math.round(r.width), visibleInViewport: r.x >= 0 && r.x + r.width <= window.innerWidth && r.y >= 0 && r.y + r.height <= window.innerHeight };
    });
    const svg = ov.querySelector("svg");
    const sr = svg?.getBoundingClientRect();
    const xbtn = ov.querySelector('button[aria-label="Close menu"]');
    const xr = xbtn?.getBoundingClientRect();
    return {
      overlay: "present",
      overlayBg: cs.backgroundColor,
      overlayOpacity: cs.opacity,
      viewport: `${window.innerWidth}x${window.innerHeight}`,
      circleSvg: sr ? { x: Math.round(sr.x), y: Math.round(sr.y), w: Math.round(sr.width), h: Math.round(sr.height) } : null,
      closeBtn: xr ? { x: Math.round(xr.x), y: Math.round(xr.y) } : null,
      links,
    };
  });
  console.log(`\n=== ${vp.name} (${vp.width}x${vp.height}) ===`);
  console.log(JSON.stringify(data, null, 2));
  await page.screenshot({ path: `/tmp/radial-${vp.name}.png` });
  await ctx.close();
}
await browser.close();

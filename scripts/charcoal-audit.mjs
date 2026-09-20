/* Check whether charcoal utilities generate real CSS on our clone vs source.
 * Usage: bun scripts/charcoal-audit.mjs [origin]
 */
import { chromium } from "@playwright/test";

const origin = process.argv[2] || "http://localhost:3000";
const browser = await chromium.launch();
const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 } });
const page = await ctx.newPage();
await page.goto(`${origin}/contact`, { waitUntil: "domcontentloaded", timeout: 60000 }).catch(() => {});
await page.waitForTimeout(2500);

const data = await page.evaluate(() => {
  const submit = document.querySelector("form button[type=submit], form button:last-of-type");
  const hero = document.querySelector('[aria-label="Introduction"], main');
  // Any element with a charcoal class:
  const charcoalEls = Array.from(document.querySelectorAll("[class*=charcoal]")).slice(0, 8).map((el) => {
    const cs = getComputedStyle(el);
    return {
      cls: (el.className?.toString?.() || "").match(/[^ ]*charcoal[^ ]*/g)?.join(" "),
      bg: cs.backgroundColor,
      backgroundImage: cs.backgroundImage.slice(0, 60),
      color: cs.color,
    };
  });
  return { submitBg: submit ? getComputedStyle(submit).backgroundColor : null, charcoalEls };
});
console.log(JSON.stringify(data, null, 2));
await browser.close();

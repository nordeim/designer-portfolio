/* Session-17 remediated screenshots: the auth screen (login card), the
 * standalone 404, the project-not-found state, and the restructured legal
 * pages. Recaptures 06 (login redesigned to the reference auth card) and
 * adds 24–27.
 */
import { chromium } from "@playwright/test";

const OUT = "docs/screenshots";
const BASE = "http://localhost:3000";
const browser = await chromium.launch();

// 06 — login auth card (reference design: avatar, rounded card, icons).
{
  const ctx = await browser.newContext({ viewport: { width: 1280, height: 720 } });
  const page = await ctx.newPage();
  await page.goto(`${BASE}/login`, { waitUntil: "networkidle" });
  await page.waitForTimeout(600);
  await page.screenshot({ path: `${OUT}/06-login.png` });
  await ctx.close();
}

// 24 — standalone 404 for unmatched routes (quoted pathname + Go Home).
{
  const ctx = await browser.newContext({ viewport: { width: 1280, height: 720 } });
  const page = await ctx.newPage();
  await page.goto(`${BASE}/this-page-does-not-exist`, { waitUntil: "networkidle" }).catch(() => {});
  await page.waitForTimeout(400);
  await page.screenshot({ path: `${OUT}/24-standalone-404.png` });
  await ctx.close();
}

// 25 — project-not-found (site chrome + centered mono message).
{
  const ctx = await browser.newContext({ viewport: { width: 1280, height: 720 } });
  const page = await ctx.newPage();
  await page.goto(`${BASE}/project/does-not-exist`, { waitUntil: "networkidle" }).catch(() => {});
  await page.waitForTimeout(400);
  await page.screenshot({ path: `${OUT}/25-project-not-found.png` });
  await ctx.close();
}

// 26 — privacy page (reference section anatomy).
{
  const ctx = await browser.newContext({ viewport: { width: 1280, height: 720 } });
  const page = await ctx.newPage();
  await page.goto(`${BASE}/privacy`, { waitUntil: "networkidle" });
  await page.waitForTimeout(400);
  await page.screenshot({ path: `${OUT}/26-privacy-legal.png` });
  await ctx.close();
}

// 27 — accessibility page (reference section anatomy + adjustments list).
{
  const ctx = await browser.newContext({ viewport: { width: 1280, height: 720 } });
  const page = await ctx.newPage();
  await page.goto(`${BASE}/accessibility`, { waitUntil: "networkidle" });
  await page.waitForTimeout(400);
  await page.screenshot({ path: `${OUT}/27-accessibility-legal.png` });
  await ctx.close();
}

await browser.close();
console.log("session-18 screenshots captured: 06 (recapture), 24, 25, 26, 27");

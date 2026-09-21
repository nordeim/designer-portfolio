/**
 * Session 24 — dev-server verification screenshots: proves the remediated
 * codebase runs under `bun run dev` (Turbopack) and captures the remediated
 * surfaces: the smooth works-row hover scale (mid-flight + settled), the
 * dynamic robots.txt contract, the source-aligned sitemap.xml, and the
 * dashboard sign-out avatar row. Saved under docs/screenshots/ (36+).
 */
import { chromium } from 'playwright';

const BASE = process.env.CAPTURE_BASE ?? 'http://localhost:3000';
const OUT = 'docs/screenshots';
const EMAIL = process.env.E2E_ADMIN_EMAIL ?? 'admin@alexmoreau.design';
const PASSWORD = process.env.E2E_ADMIN_PASSWORD ?? '';

const browser = await chromium.launch();

// Verify the dev server responds before capturing.
const probe = await browser.newPage();
await probe.goto(BASE + '/login', { waitUntil: 'networkidle', timeout: 60000 });
console.log('probe: dev server reachable');
await probe.close();

// ---- 36: works-row hover, mid-transition (the smoothness proof) ----
{
  const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 } });
  const page = await ctx.newPage();
  await page.goto(BASE + '/', { waitUntil: 'networkidle', timeout: 60000 });
  const img = page.locator("a[href^='/project/'] img").first();
  await img.scrollIntoViewIfNeeded();
  await page.waitForTimeout(900);
  await img.hover();
  await page.waitForTimeout(260); // ~35% through the 700ms flight
  await page.screenshot({ path: `${OUT}/36-dev-works-hover-midflight.png` });
  const s = await img.evaluate((el) => getComputedStyle(el).scale);
  console.log(`captured 36 (mid-flight scale: ${s})`);
  await ctx.close();
}

// ---- 37: works-row hover, settled at 1.05 ----
{
  const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 } });
  const page = await ctx.newPage();
  await page.goto(BASE + '/', { waitUntil: 'networkidle', timeout: 60000 });
  const img = page.locator("a[href^='/project/'] img").first();
  await img.scrollIntoViewIfNeeded();
  await page.waitForTimeout(900);
  await img.hover();
  await page.waitForTimeout(1100); // settled
  await page.screenshot({ path: `${OUT}/37-dev-works-hover-settled.png` });
  const s = await img.evaluate((el) => getComputedStyle(el).scale);
  console.log(`captured 37 (settled scale: ${s})`);
  await ctx.close();
}

// ---- 38: robots.txt — the dynamic contract ----
{
  const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 } });
  const page = await ctx.newPage();
  await page.goto(BASE + '/robots.txt', { waitUntil: 'domcontentloaded', timeout: 60000 });
  await page.waitForTimeout(400);
  await page.screenshot({ path: `${OUT}/38-dev-robots-dynamic.png` });
  const body = await page.evaluate(() => document.body.innerText);
  console.log(`captured 38 (has Disallow: ${body.includes('Disallow: /dashboard')})`);
  await ctx.close();
}

// ---- 39: sitemap.xml — the source-aligned route set ----
{
  const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 } });
  const page = await ctx.newPage();
  await page.goto(BASE + '/sitemap.xml', { waitUntil: 'domcontentloaded', timeout: 60000 });
  await page.waitForTimeout(400);
  await page.screenshot({ path: `${OUT}/39-dev-sitemap-source-parity.png` });
  const locs = await page.evaluate(() => (document.body.innerText.match(/<loc>/g) || []).length);
  console.log(`captured 39 (loc count: ${locs})`);
  await ctx.close();
}

// ---- 40: dashboard sign-out avatar (password-gated) ----
if (PASSWORD) {
  const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 } });
  const page = await ctx.newPage();
  await page.goto(BASE + '/login', { waitUntil: 'networkidle', timeout: 60000 });
  await page.getByRole('textbox', { name: 'Email', exact: true }).fill(EMAIL);
  await page.getByRole('textbox', { name: 'Password', exact: true }).fill(PASSWORD);
  await page.getByRole('button', { name: 'Sign in' }).click();
  await page.waitForURL('**/dashboard', { timeout: 30000 });
  await page.waitForTimeout(1200);
  // Frame the sidebar footer (the sign-out row with the avatar).
  const sidebar = page.locator('aside');
  await sidebar.screenshot({ path: `${OUT}/40-dev-dashboard-signout-avatar.png` });
  console.log('captured 40 (dashboard sidebar w/ avatar)');
  await ctx.close();
} else {
  console.log('skipped 40 (E2E_ADMIN_PASSWORD unset)');
}

await browser.close();
console.log('done');

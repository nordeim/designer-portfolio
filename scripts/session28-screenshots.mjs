/**
 * Session 28 — dev-server verification screenshots: proves the remediated
 * codebase runs under `bun run dev` (Turbopack) and captures the session-28
 * remediated surfaces: the mobile (390px) display h1s at the source's
 * leading-tight 45px line-height, the project-detail intro h2 at the
 * source's leading-snug 41.25px, the legal h2s back at 20px/28px on every
 * breakpoint, and the head-metadata surface (og:image/og:url/canonical/
 * manifest + apple metas — rendered as the social-card-bearing contact
 * page, metrics logged at capture). Saved under docs/screenshots/ (46+).
 */
import { chromium } from 'playwright';

const BASE = process.env.CAPTURE_BASE ?? 'http://localhost:3000';
const OUT = 'docs/screenshots';

const browser = await chromium.launch();

// Verify the server responds before capturing.
const probe = await browser.newPage();
await probe.goto(BASE + '/login', { waitUntil: 'networkidle', timeout: 60000 });
console.log('probe: server reachable');
await probe.close();

// ---- 46: contact h1 at mobile — leading-tight 45px (session 28) ----
{
  const ctx = await browser.newContext({ viewport: { width: 390, height: 844 } });
  const page = await ctx.newPage();
  await page.goto(BASE + '/contact', { waitUntil: 'networkidle', timeout: 60000 });
  await page.waitForTimeout(900);
  await page.screenshot({ path: `${OUT}/46-dev-contact-h1-mobile-leading-tight.png`, fullPage: false });
  const h1 = page.locator('h1');
  const fs = await h1.evaluate((el) => getComputedStyle(el).fontSize);
  const lh = await h1.evaluate((el) => getComputedStyle(el).lineHeight);
  console.log(`captured 46 (contact h1 mobile ${fs}/${lh} — source parity 45px)`);
  await ctx.close();
}

// ---- 47: about h1 at mobile — leading-tight 45px (session 28) ----
{
  const ctx = await browser.newContext({ viewport: { width: 390, height: 844 } });
  const page = await ctx.newPage();
  await page.goto(BASE + '/about', { waitUntil: 'networkidle', timeout: 60000 });
  await page.waitForTimeout(900);
  await page.screenshot({ path: `${OUT}/47-dev-about-h1-mobile-leading-tight.png`, fullPage: false });
  const h1 = page.locator('h1');
  const fs = await h1.evaluate((el) => getComputedStyle(el).fontSize);
  const lh = await h1.evaluate((el) => getComputedStyle(el).lineHeight);
  console.log(`captured 47 (about h1 mobile ${fs}/${lh} — source parity 45px)`);
  await ctx.close();
}

// ---- 48: project-detail intro h2 — leading-snug 41.25px (session 28) ----
{
  const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 } });
  const page = await ctx.newPage();
  await page.goto(BASE + '/project/kinto-cafe-branding', { waitUntil: 'networkidle', timeout: 60000 });
  await page.waitForTimeout(900);
  const h2 = page.getByLabel('Project detail').getByRole('heading', { name: 'Matcha, elevated' });
  await h2.scrollIntoViewIfNeeded();
  await page.waitForTimeout(400);
  await page.screenshot({ path: `${OUT}/48-dev-detail-h2-leading-snug.png`, fullPage: false });
  const fs = await h2.evaluate((el) => getComputedStyle(el).fontSize);
  const lh = await h2.evaluate((el) => getComputedStyle(el).lineHeight);
  console.log(`captured 48 (detail intro h2 ${fs}/${lh} — source parity 41.25px)`);
  await ctx.close();
}

// ---- 49: legal h2s at 20px/28px on desktop (session 28) ----
{
  const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 } });
  const page = await ctx.newPage();
  await page.goto(BASE + '/privacy', { waitUntil: 'networkidle', timeout: 60000 });
  await page.waitForTimeout(900);
  const h2 = page.locator('h2').first();
  await h2.scrollIntoViewIfNeeded();
  await page.evaluate(() => window.scrollBy(0, -120));
  await page.waitForTimeout(400);
  await page.screenshot({ path: `${OUT}/49-dev-legal-h2-text-xl.png`, fullPage: false });
  const fs = await h2.evaluate((el) => getComputedStyle(el).fontSize);
  const lh = await h2.evaluate((el) => getComputedStyle(el).lineHeight);
  console.log(`captured 49 (legal h2 ${fs}/${lh} — source parity, no md step)`);
  await ctx.close();
}

// ---- 50: the head-metadata surface — contact page with the full card ----
{
  const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 } });
  const page = await ctx.newPage();
  await page.goto(BASE + '/contact', { waitUntil: 'networkidle', timeout: 60000 });
  await page.waitForTimeout(900);
  await page.screenshot({ path: `${OUT}/50-dev-head-metadata-surface.png`, fullPage: false });
  const meta = await page.evaluate(() => ({
    ogTitle: document.head.querySelector('meta[property="og:title"]')?.getAttribute('content'),
    ogImage: document.head.querySelector('meta[property="og:image"]')?.getAttribute('content'),
    ogUrl: document.head.querySelector('meta[property="og:url"]')?.getAttribute('content'),
    canonical: document.head.querySelector('link[rel="canonical"]')?.getAttribute('href'),
    manifest: document.head.querySelector('link[rel="manifest"]')?.getAttribute('href'),
    appleTitle: document.head.querySelector('meta[name="apple-mobile-web-app-title"]')?.getAttribute('content'),
  }));
  console.log('captured 50 (head surface:', JSON.stringify(meta) + ')');
  await ctx.close();
}

await browser.close();
console.log('session 28 screenshots complete: 46–50');

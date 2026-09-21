/**
 * Session 26 — dev-server verification screenshots: proves the remediated
 * codebase runs under `bun run dev` (Turbopack) and captures the remediated
 * deep-behavior surfaces: the source-typography FAQ accordion (open state,
 * 128px panel), the 12px-inset form fields with 48px select triggers, the
 * pinned project-detail intro column at y=138 (mid-scroll), the keyboard
 * focus-ring coverage parity (CTA cobalt ring, menu bare), and the
 * default-line-height contact h1. Saved under docs/screenshots/ (41+).
 */
import { chromium } from 'playwright';

const BASE = process.env.CAPTURE_BASE ?? 'http://localhost:3000';
const OUT = 'docs/screenshots';

const browser = await chromium.launch();

// Verify the dev server responds before capturing.
const probe = await browser.newPage();
await probe.goto(BASE + '/login', { waitUntil: 'networkidle', timeout: 60000 });
console.log('probe: dev server reachable');
await probe.close();

// ---- 41: FAQ accordion, open — source typography (16px/500 trigger, 128px panel) ----
{
  const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 } });
  const page = await ctx.newPage();
  await page.goto(BASE + '/contact', { waitUntil: 'networkidle', timeout: 60000 });
  await page.waitForTimeout(900);
  // Open the first FAQ item, then frame the accordion region.
  const firstTrigger = page.locator('[data-slot="accordion-trigger"]').first();
  await firstTrigger.scrollIntoViewIfNeeded();
  await firstTrigger.click();
  await page.waitForTimeout(500); // open animation settles
  const faqSection = page.locator('[data-slot="accordion-item"]').first().locator('..');
  await page.screenshot({ path: `${OUT}/41-dev-faq-open-source-typography.png`, fullPage: false });
  const triggerFs = await firstTrigger.evaluate((el) => getComputedStyle(el).fontSize);
  const triggerFw = await firstTrigger.evaluate((el) => getComputedStyle(el).fontWeight);
  const panel = page.locator('[data-slot="accordion-content"]').first();
  const panelH = (await panel.boundingBox())?.height;
  console.log(`captured 41 (trigger ${triggerFs}/${triggerFw}, open panel ${panelH}px)`);
  await ctx.close();
}

// ---- 42: form fields — 12px insets + 48px select triggers ----
{
  const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 } });
  const page = await ctx.newPage();
  await page.goto(BASE + '/contact', { waitUntil: 'networkidle', timeout: 60000 });
  await page.waitForTimeout(900);
  const nameInput = page.locator('input[name="name"]');
  // Scroll past the h1/intro so the capture frames the form fields —
  // name/email inputs + the 48px select triggers (the inset/height fix).
  const selTrigger = page.locator('[data-slot="select-trigger"]').first();
  await selTrigger.scrollIntoViewIfNeeded();
  await page.evaluate(() => window.scrollBy(0, -80));
  await page.waitForTimeout(400);
  await page.screenshot({ path: `${OUT}/42-dev-form-field-insets.png`, fullPage: false });
  const pad = await nameInput.evaluate((el) => getComputedStyle(el).paddingLeft);
  const h = (await selTrigger.boundingBox())?.height;
  console.log(`captured 42 (input padding-left ${pad}, select height ${h}px)`);
  await ctx.close();
}

// ---- 43: project-detail pinned intro at y=138 (mid-scroll) ----
{
  const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 } });
  const page = await ctx.newPage();
  await page.goto(BASE + '/projects', { waitUntil: 'networkidle', timeout: 60000 });
  await page.waitForTimeout(600);
  const firstProject = page.locator("a[href^='/project/']").first();
  const href = await firstProject.getAttribute('href');
  await page.goto(BASE + href, { waitUntil: 'networkidle', timeout: 60000 });
  await page.waitForTimeout(900);
  // Scroll well past the pin start (~890) — mid-gallery.
  await page.evaluate(() => window.scrollTo(0, 2400));
  await page.waitForTimeout(600);
  await page.screenshot({ path: `${OUT}/43-dev-detail-pinned-intro-138.png`, fullPage: false });
  const intro = page.locator('.md\\:sticky');
  const box = await intro.boundingBox();
  console.log(`captured 43 (intro column at y=${box?.y}, sticky top 138px)`);
  await ctx.close();
}

// ---- 44: focus-ring coverage parity — CTA cobalt ring (plain focus:) ----
{
  const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 } });
  const page = await ctx.newPage();
  await page.goto(BASE + '/', { waitUntil: 'networkidle', timeout: 60000 });
  await page.waitForTimeout(900);
  // Programmatic focus (same as the e2e spec) — the source's plain `focus:`
  // rings respond to it; scroll the footer CTA into view first.
  const cta = page.getByRole('link', { name: 'Start a Project →' });
  await cta.scrollIntoViewIfNeeded();
  await cta.focus();
  await page.waitForTimeout(300);
  await page.screenshot({ path: `${OUT}/44-dev-cta-focus-ring.png`, fullPage: false });
  const active = await cta.evaluate((el) => ({
    text: el.textContent?.trim().slice(0, 24),
    ring: getComputedStyle(el).boxShadow,
  }));
  const menuBtn = page.getByRole('button', { name: 'Open menu' });
  await menuBtn.focus();
  const menuRing = await menuBtn.evaluate((el) => getComputedStyle(el).boxShadow);
  console.log(`captured 44 (CTA "${active.text}" ring: ${active.ring.slice(0, 60)}…)`);
  console.log(`  menu chrome ring-free: ${menuRing === 'none'}`);
  await ctx.close();
}

// ---- 45: contact h1 default line-height (72px) — element capture ----
{
  const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 } });
  const page = await ctx.newPage();
  await page.goto(BASE + '/contact', { waitUntil: 'networkidle', timeout: 60000 });
  await page.waitForTimeout(900);
  // Frame the h1 block itself (element shot) — the 72px line-height proof.
  const h1 = page.locator('h1').first();
  await h1.screenshot({ path: `${OUT}/45-dev-contact-h1-lineheight.png` });
  const lh = await h1.evaluate((el) => getComputedStyle(el).lineHeight);
  const fs = await h1.evaluate((el) => getComputedStyle(el).fontSize);
  console.log(`captured 45 (contact h1 ${fs}/${lh})`);
  await ctx.close();
}

await browser.close();
console.log('done');

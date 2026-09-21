/**
 * Session 22 — functional-behavior parity audit: source vs clone.
 * Covers the interactive surfaces the DOM line-diff does not:
 *   1. Radial menu: open, item labels, projects submenu
 *   2. Theme toggle: body background swap light/dark
 *   3. Contact form validation: empty-submit error surfaces
 *   4. Login validation: empty-submit + invalid-credentials error copy
 */
import { chromium } from 'playwright';
import fs from 'node:fs';

const CLONE = 'http://localhost:3000';
const SRC = 'https://designer-portfolio.base44.app';
const EMAIL = 'sepnetflix2023@outlook.com';
const PASSWORD = '$Abcd1234';
const CLONE_ADMIN = 'admin@alexmoreau.design';
const CLONE_PASS = process.env.CLONE_ADMIN_PASSWORD || 'AdminPass123';

const report = { radialMenu: {}, theme: {}, contactValidation: {}, loginValidation: {} };
const norm = (s) => (s || '').replace(/\s+/g, ' ').trim();

const browser = await chromium.launch();

// ---------- helper: probe one origin ----------
async function probeMenu(origin) {
  const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 } });
  const page = await ctx.newPage();
  await page.goto(origin + '/', { waitUntil: 'networkidle', timeout: 45000 });
  await page.waitForTimeout(1500);
  const out = {};
  // The MENU button — pick the VISIBLE instance (mobile one is hidden at 1440px)
  const menuBtns = page.locator('button', { hasText: /^menu$/i });
  const n = await menuBtns.count();
  out.menuButtonFound = n > 0;
  if (out.menuButtonFound) {
    let clicked = false;
    for (let i = 0; i < n; i++) {
      const b = menuBtns.nth(i);
      if (await b.isVisible().catch(() => false)) {
        await b.click();
        clicked = true;
        break;
      }
    }
    if (!clicked) {
      out.error = 'no visible menu button';
    }
  }
  if (out.menuButtonFound && !out.error) {
    await page.waitForTimeout(1200);
    // overlay text lines
    out.overlayLines = await page.evaluate(() => {
      const lines = document.body.innerText.split('\n')
        .map((s) => s.replace(/\s+/g, ' ').trim()).filter(Boolean);
      return lines.slice(0, 40);
    });
    // links inside any fixed/absolute overlay
    out.overlayLinks = await page.evaluate(() => {
      const n2 = (s) => (s || '').replace(/\s+/g, ' ').trim();
      return [...document.querySelectorAll('a')].filter(a => {
        const r = a.getBoundingClientRect();
        return r.width > 0 && r.height > 0;
      }).map(a => n2(a.textContent)).filter(Boolean).slice(0, 25);
    });
    // hover the Projects entry to reveal the submenu
    const projectsEntry = page.locator('a:has-text("Projects"), [role="link"]:has-text("Projects")').first();
    if (await projectsEntry.count() > 0) {
      await projectsEntry.hover().catch(() => {});
      await page.waitForTimeout(900);
      out.afterProjectsHover = await page.evaluate(() => {
        const lines = document.body.innerText.split('\n')
          .map((s) => s.replace(/\s+/g, ' ').trim()).filter(Boolean);
        return lines.slice(0, 50);
      });
    }
    // escape closes
    await page.keyboard.press('Escape');
    await page.waitForTimeout(700);
  }
  await ctx.close();
  return out;
}

async function probeTheme(origin) {
  const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 } });
  const page = await ctx.newPage();
  await page.goto(origin + '/', { waitUntil: 'networkidle', timeout: 45000 });
  await page.waitForTimeout(1200);
  const out = {};
  out.bodyBgBefore = await page.evaluate(() => getComputedStyle(document.body).backgroundColor);
  // theme toggle: pick the VISIBLE instance (mobile one hidden at 1440px)
  const toggles = page.locator('button[aria-label*="theme" i], button[aria-label*="Toggle" i]');
  const tn = await toggles.count();
  out.toggleFound = tn > 0;
  if (out.toggleFound) {
    for (let i = 0; i < tn; i++) {
      const t = toggles.nth(i);
      if (await t.isVisible().catch(() => false)) {
        await t.click();
        await page.waitForTimeout(800);
        out.bodyBgAfter = await page.evaluate(() => getComputedStyle(document.body).backgroundColor);
        break;
      }
    }
    if (!out.bodyBgAfter) out.error = 'no visible toggle';
  }
  await ctx.close();
  return out;
}

async function probeContactValidation(origin) {
  const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 } });
  const page = await ctx.newPage();
  await page.goto(origin + '/contact', { waitUntil: 'networkidle', timeout: 45000 });
  await page.waitForTimeout(1200);
  const out = {};
  // submit empty form
  const submit = page.locator('button[type="submit"], form button').last();
  out.submitFound = await submit.count() > 0;
  if (out.submitFound) {
    await submit.click();
    await page.waitForTimeout(1800);
    out.errorTexts = await page.evaluate(() => {
      return [...document.querySelectorAll('[role="alert"], .text-destructive, p[class*="destructive"], [data-error], [aria-live]')]
        .map(e => (e.textContent || "").replace(/\s+/g, " ").trim()).filter(t => t && t.length < 200).slice(0, 12);
    });
    out.bodyAfterLines = await page.evaluate(() => {
      return document.body.innerText.split('\n').map(s => s.replace(/\s+/g, ' ').trim()).filter(Boolean).slice(-15);
    });
  }
  await ctx.close();
  return out;
}

async function probeLoginValidation(origin, creds) {
  const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 } });
  const page = await ctx.newPage();
  await page.goto(origin + '/login', { waitUntil: 'networkidle', timeout: 45000 });
  await page.waitForTimeout(1200);
  const out = {};
  // 1. empty submit
  const submit = page.locator('button[type="submit"]').first();
  if (await submit.count() > 0) {
    await submit.click();
    await page.waitForTimeout(1500);
    out.emptySubmitErrors = await page.evaluate(() => {
      return [...document.querySelectorAll('[role="alert"], p, div')]
        .map(e => (e.textContent || "").replace(/\s+/g, " ").trim()).filter(t => t && t.length > 3 && t.length < 150
          && /required|valid|password|email|enter|fill|incorrect|invalid/i.test(t)).slice(0, 8);
    });
  }
  // 2. invalid credentials
  const emailInput = page.locator('input[type="email"], input[name="email"]').first();
  const passInput = page.locator('input[type="password"]').first();
  if (await emailInput.count() > 0 && await passInput.count() > 0) {
    await emailInput.fill(creds.email);
    await passInput.fill(creds.password);
    await page.locator('button[type="submit"]').first().click();
    await page.waitForTimeout(2500);
    out.invalidCredErrors = await page.evaluate(() => {
      return [...document.querySelectorAll('[role="alert"], p, div')]
        .map(e => (e.textContent || "").replace(/\s+/g, " ").trim()).filter(t => t && t.length > 3 && t.length < 150
          && /required|valid|password|email|enter|fill|incorrect|invalid|error|try/i.test(t)).slice(0, 8);
    });
    out.urlAfter = page.url();
  }
  await ctx.close();
  return out;
}

// ---------- run ----------
report.radialMenu.source = await probeMenu(SRC);
report.radialMenu.clone = await probeMenu(CLONE);
report.theme.source = await probeTheme(SRC);
report.theme.clone = await probeTheme(CLONE);
report.contactValidation.source = await probeContactValidation(SRC);
report.contactValidation.clone = await probeContactValidation(CLONE);
report.loginValidation.source = await probeLoginValidation(SRC, { email: 'nobody@example.com', password: 'wrong-password' });
report.loginValidation.clone = await probeLoginValidation(CLONE, { email: 'nobody@example.com', password: 'wrong-password' });

fs.mkdirSync('scripts/out', { recursive: true });
fs.writeFileSync('scripts/out/session22-functional-audit.json', JSON.stringify(report, null, 2));
console.log(JSON.stringify(report, null, 2));
await browser.close();

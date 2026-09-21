/**
 * Session 17 — source-site dashboard audit.
 * Logs into https://designer-portfolio.base44.app with the operator-provided
 * credentials and captures the authenticated dashboard surface: routes,
 * headings, key UI blocks, and a screenshot — the ground truth for the
 * clone's dashboard parity check.
 *
 * Usage: node scripts/session18-source-dashboard-audit.mjs
 * Output: scripts/out/source-dashboard-audit.json + .png
 */
import { chromium } from 'playwright';
import fs from 'node:fs';
import path from 'node:path';

const OUT_DIR = path.resolve('scripts/out');
fs.mkdirSync(OUT_DIR, { recursive: true });

const SRC = 'https://designer-portfolio.base44.app';
const EMAIL = 'sepnetflix2023@outlook.com';
const PASSWORD = '$Abcd1234';

const bText = (sel) => page.evaluate(
  (s) => document.querySelector(s)?.textContent?.trim() ?? null, sel);
const bCond = (sel) => page.evaluate(
  (s) => document.querySelector(s) !== null, sel);

const report = { login: {}, routes: {}, errors: [] };

const browser = await chromium.launch();
const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 } });
const page = await ctx.newPage();
page.on('console', (m) => { if (m.type() === 'error') report.errors.push(m.text().slice(0, 300)); });
page.on('pageerror', (e) => report.errors.push(String(e).slice(0, 300)));

// ---- 1. Login -----------------------------------------------------------
await page.goto(SRC + '/login', { waitUntil: 'networkidle', timeout: 45000 });
report.login.loginPageUrl = page.url();

// Fill the credentials — resilient to unknown input order.
const emailSel = 'input[type="email"], input[name="email"], input[name="identifier"]';
const passSel = 'input[type="password"], input[name="password"]';
await page.locator(emailSel).first().fill(EMAIL);
await page.locator(passSel).first().fill(PASSWORD);

// Submit via button (fall back to Enter).
const submit = page.locator('button[type="submit"], button:has-text("Sign in"), button:has-text("Log in"), button:has-text("Login")').first();
try {
  await Promise.all([
    page.waitForURL((u) => !String(u).includes('/login'), { timeout: 20000 }).catch(() => {}),
    submit.click({ timeout: 5000 }),
  ]);
} catch {
  await page.keyboard.press('Enter');
  await page.waitForURL((u) => !String(u).includes('/login'), { timeout: 20000 }).catch(() => {});
}
await page.waitForLoadState('networkidle', { timeout: 30000 }).catch(() => {});
report.login.afterLoginUrl = page.url();
await page.screenshot({ path: path.join(OUT_DIR, 'source-dashboard.png'), fullPage: false });

// ---- 2. Dashboard surface ------------------------------------------------
async function auditRoute(name, route) {
  await page.goto(SRC + route, { waitUntil: 'networkidle', timeout: 45000 }).catch(() => {});
  await page.waitForTimeout(800);
  const r = {
    url: page.url(),
    title: await page.title(),
    h1: await bText('h1'), h2: await bText('h2'),
    headings: await page.locator('h1, h2, h3, h4').allInnerTexts().catch(() => []),
    buttons: await page.locator('button').allInnerTexts().catch(() => []),
    links: (await page.locator('nav a, header a, aside a').allInnerTexts().catch(() => []))
      .map((s) => s.trim()).filter(Boolean).slice(0, 30),
    tables: await page.locator('table').count(),
    tableHeaders: await page.locator('table th').allInnerTexts().catch(() => []),
    forms: await page.locator('form').count(),
    inputs: await page.locator('input, textarea, select').count(),
    hasBadge: await bCond('[class*="badge"], [class*="Badge"]'),
    bodySample: (await page.locator('main, [role="main"], body').first().innerText().catch(() => '')).slice(0, 1500),
  };
  report.routes[name] = r;
  await page.screenshot({ path: path.join(OUT_DIR, `source-${name}.png`) });
}

await auditRoute('dashboard', '/dashboard');
// Common admin routes (probe; 404s are fine — we map what exists).
for (const [name, route] of [
  ['projects', '/dashboard/projects'],
  ['inquiries', '/dashboard/inquiries'],
]) {
  await auditRoute(name, route);
}

// ---- 3. What does the source call these pages? Nav labels ---------------
report.login.navAfterLogin = (await page.locator('header a, nav a').allInnerTexts().catch(() => []))
  .map((s) => s.trim()).filter(Boolean);

fs.writeFileSync(path.join(OUT_DIR, 'source-dashboard-audit.json'), JSON.stringify(report, null, 2));
console.log(JSON.stringify({
  afterLoginUrl: report.login.afterLoginUrl,
  nav: report.login.navAfterLogin,
  errors: report.errors.length,
  routes: Object.fromEntries(Object.entries(report.routes).map(([k, v]) => [k, {
    url: v.url, h1: v.h1, headings: v.headings.slice(0, 8), tables: v.tables,
    tableHeaders: v.tableHeaders, buttons: v.buttons.slice(0, 10),
  }])),
}, null, 2));

await browser.close();

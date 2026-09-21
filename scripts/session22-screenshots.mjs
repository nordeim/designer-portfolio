/**
 * Session 22 — dev-server verification screenshots: proves the remediated
 * codebase (error-surface parity: login alert card, contact system toasts)
 * runs under `bun run dev` (Turbopack). Captures the three remediated
 * interactive surfaces + a base shot. Saved under docs/screenshots/ following
 * the numbered convention (32+).
 */
import { chromium } from 'playwright';
import fs from 'node:fs';

const BASE = process.env.CAPTURE_BASE ?? 'http://localhost:3000';
const OUT = 'docs/screenshots';

const browser = await chromium.launch();

// Verify the dev server is reachable before capturing.
const probe = await browser.newPage();
await probe.goto(BASE + '/login', { waitUntil: 'networkidle', timeout: 60000 });
console.log('probe: dev server reachable');
await probe.close();

// ---- 32: login invalid-credentials alert card (session-22 remediation) ----
{
  const ctx = await browser.newContext({ viewport: { width: 1280, height: 720 } });
  const page = await ctx.newPage();
  await page.goto(BASE + '/login', { waitUntil: 'networkidle', timeout: 60000 });
  await page.waitForTimeout(1200);
  await page.getByRole('textbox', { name: 'Email', exact: true }).fill('nobody@example.com');
  await page.getByRole('textbox', { name: 'Password', exact: true }).fill('wrong-password-xyz');
  await page.getByRole('button', { name: 'Sign in', exact: true }).click();
  await page.getByRole('alert').filter({ hasText: /^Invalid email or password$/ }).waitFor({ timeout: 15000 });
  await page.waitForTimeout(500);
  await page.screenshot({ path: `${OUT}/32-dev-login-error-alert.png` });
  console.log(`captured ${OUT}/32-dev-login-error-alert.png`);
  await ctx.close();
}

// ---- 33: contact destructive toast (empty submit) ----
{
  const ctx = await browser.newContext({ viewport: { width: 1280, height: 720 } });
  const page = await ctx.newPage();
  await page.goto(BASE + '/contact', { waitUntil: 'networkidle', timeout: 60000 });
  await page.waitForTimeout(1500);
  await page.locator('form button[type="submit"]').first().click({ force: true });
  await page.getByRole('alert').filter({ hasText: 'Please fill in all required fields.' }).waitFor({ timeout: 15000 });
  await page.waitForTimeout(500);
  await page.screenshot({ path: `${OUT}/33-dev-contact-error-toast.png` });
  console.log(`captured ${OUT}/33-dev-contact-error-toast.png`);
  await ctx.close();
}

// ---- 34: contact success state + light system toast ----
{
  const ctx = await browser.newContext({ viewport: { width: 1280, height: 720 } });
  const page = await ctx.newPage();
  await page.goto(BASE + '/contact', { waitUntil: 'networkidle', timeout: 60000 });
  await page.waitForTimeout(1500);
  const stamp = Date.now();
  const form = page.getByLabel('Project inquiry form');
  await form.getByLabel('Name *').fill(`Dev Capture ${stamp}`);
  await form.getByLabel('Email *').fill(`dev-capture-${stamp}@example.com`);
  await form.getByRole('combobox', { name: 'Project Type' }).click();
  await page.getByRole('option', { name: 'Brand Identity', exact: true }).click();
  await form.getByRole('combobox', { name: 'Budget Range' }).click();
  await page.getByRole('option', { name: '$10K – $25K', exact: true }).click();
  await form.getByRole('combobox', { name: 'Timeline' }).click();
  await page.getByRole('option', { name: '1 – 2 months', exact: true }).click();
  await form.getByLabel('Project Details *').fill('Screenshot-capture inquiry submitted against the dev server for the session-22 verification set.');
  await form.getByRole('button', { name: 'Send Inquiry' }).click();
  await page.getByText('Thank you for reaching out.').waitFor({ timeout: 20000 });
  await page.locator('ol > li').filter({ hasText: 'Inquiry sent successfully.' }).waitFor({ timeout: 10000 });
  await page.waitForTimeout(400);
  await page.screenshot({ path: `${OUT}/34-dev-contact-success-toast.png` });
  console.log(`captured ${OUT}/34-dev-contact-success-toast.png`);
  await ctx.close();
}

// ---- 35: login card (divider + Google hover parity remediation, static) ----
{
  const ctx = await browser.newContext({ viewport: { width: 1280, height: 720 } });
  const page = await ctx.newPage();
  await page.goto(BASE + '/login', { waitUntil: 'networkidle', timeout: 60000 });
  await page.waitForTimeout(1200);
  await page.screenshot({ path: `${OUT}/35-dev-login-card-divider.png` });
  console.log(`captured ${OUT}/35-dev-login-card-divider.png`);
  await ctx.close();
}

// Validate the captures are real images (not blank).
for (const f of fs.readdirSync(OUT).filter((n) => /^3[2-5]-dev-/.test(n))) {
  const stat = fs.statSync(`${OUT}/${f}`);
  const ok = stat.size > 10_000;
  console.log(`${f}: ${stat.size} bytes ${ok ? 'OK' : 'SUSPICIOUSLY SMALL'}`);
}

await browser.close();
console.log('done');

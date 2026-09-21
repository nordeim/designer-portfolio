/**
 * Session 17 — source-site authenticated vs anonymous home diff.
 * The base44 source has no /dashboard route; the "dashboard" the operator
 * sees after login must be a state of one of the public pages. This probe
 * diffs the logged-in home page against the anonymous one (DOM-level) and
 * also probes common admin paths to map what actually exists.
 */
import { chromium } from 'playwright';
import fs from 'node:fs';

const SRC = 'https://designer-portfolio.base44.app';
const EMAIL = 'sepnetflix2023@outlook.com';
const PASSWORD = '$Abcd1234';

const browser = await chromium.launch();
const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 } });
const page = await ctx.newPage();

// ---- anonymous snapshot --------------------------------------------------
await page.goto(SRC + '/', { waitUntil: 'networkidle', timeout: 45000 });
await page.waitForTimeout(1200);
const anon = await page.evaluate(() => ({
  links: [...document.querySelectorAll('a')].map(a => ({ href: a.getAttribute('href'), text: a.textContent.trim() })).filter(l => l.text),
  buttons: [...document.querySelectorAll('button')].map(b => b.textContent.trim()).filter(Boolean),
  textLen: document.body.innerText.length,
  textHead: document.body.innerText.slice(0, 600),
}));
await page.screenshot({ path: 'scripts/out/source-home-anon.png' });

// ---- login ---------------------------------------------------------------
await page.goto(SRC + '/login', { waitUntil: 'networkidle', timeout: 45000 });
await page.locator('input[type="email"], input[name="email"]').first().fill(EMAIL);
await page.locator('input[type="password"], input[name="password"]').first().fill(PASSWORD);
await Promise.all([
  page.waitForURL((u) => !String(u).includes('/login'), { timeout: 20000 }).catch(() => {}),
  page.locator('button[type="submit"], button:has-text("Sign in"), button:has-text("Log in"), button:has-text("Login")').first().click({ timeout: 5000 }),
]);
await page.waitForLoadState('networkidle', { timeout: 30000 }).catch(() => {});
await page.waitForTimeout(1500);
console.log('after login URL:', page.url());

// ---- authenticated snapshot ---------------------------------------------
await page.goto(page.url(), { waitUntil: 'networkidle', timeout: 45000 }).catch(() => {});
await page.waitForTimeout(1200);
const authed = await page.evaluate(() => ({
  links: [...document.querySelectorAll('a')].map(a => ({ href: a.getAttribute('href'), text: a.textContent.trim() })).filter(l => l.text),
  buttons: [...document.querySelectorAll('button')].map(b => b.textContent.trim()).filter(Boolean),
  textLen: document.body.innerText.length,
  textHead: document.body.innerText.slice(0, 600),
  cookies: document.cookie.split(';').map(c => c.split('=')[0].trim()),
}));
await page.screenshot({ path: 'scripts/out/source-home-authed.png' });

// ---- diff ----------------------------------------------------------------
const anonLinkSet = new Set(anon.links.map(l => l.href));
const newLinks = authed.links.filter(l => !anonLinkSet.has(l.href));
const anonBtnSet = new Set(anon.buttons);
const newButtons = authed.buttons.filter(b => !anonBtnSet.has(b));

const out = {
  afterLoginUrl: page.url(),
  anon: { linkCount: anon.links.length, textLen: anon.textLen },
  authed: { linkCount: authed.links.length, textLen: authed.textLen, cookies: authed.cookies },
  linksOnlyAfterLogin: newLinks,
  buttonsOnlyAfterLogin: newButtons,
  anonLinks: anon.links.slice(0, 40),
};
fs.writeFileSync('scripts/out/source-home-diff.json', JSON.stringify(out, null, 2));
console.log(JSON.stringify({
  afterLoginUrl: out.afterLoginUrl,
  newLinks: newLinks.slice(0, 20),
  newButtons: newButtons.slice(0, 20),
  anonLinkCount: anon.links.length, authedLinkCount: authed.links.length,
}, null, 2));

// ---- probe common admin paths --------------------------------------------
const probes = ['/admin', '/console', '/studio', '/manage', '/cms', '/app', '/portal', '/overview', '/home', '/profile', '/settings', '/projects', '/works'];
for (const p of probes) {
  const resp = await page.goto(SRC + p, { waitUntil: 'domcontentloaded', timeout: 20000 }).catch(() => null);
  const status = resp ? resp.status() : 'ERR';
  const h1 = await page.locator('h1').first().innerText().catch(() => null);
  console.log(`PROBE ${p} -> ${status} h1=${h1}`);
}

await browser.close();

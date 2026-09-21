/**
 * Session 34 — source login + authenticated-surface re-probe.
 * Re-traces the source login with the operator-provided credentials to
 * determine whether the source now exposes a dashboard post-login (prior
 * sessions: login → / with a localStorage token and no dashboard surface).
 */
import { chromium } from 'playwright';

const SRC = 'https://designer-portfolio.base44.app';
const EMAIL = 'sepnetflix2023@outlook.com';
const PASSWORD = '$Abcd1234';

const browser = await chromium.launch();
const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 } });
const page = await ctx.newPage();

const events = [];
page.on('framenavigated', (f) => { if (f === page.mainFrame()) events.push({ t: 'nav', url: f.url() }); });
page.on('response', (r) => {
  const u = r.url();
  if (u.includes('base44.app') && (r.status() >= 300 || u.includes('login') || u.includes('auth') || u.includes('session') || u.includes('user') || u.includes('dashboard'))) {
    events.push({ t: 'resp', status: r.status(), url: u.slice(0, 120) });
  }
});

await page.goto(SRC + '/login', { waitUntil: 'networkidle', timeout: 60000 });

await page.locator('input[type="email"], input[name="email"]').first().fill(EMAIL);
await page.locator('input[type="password"], input[name="password"]').first().fill(PASSWORD);
await page.locator('button[type="submit"], button:has-text("Sign in"), button:has-text("Log in"), button:has-text("Login")').first().click();
await page.waitForTimeout(8000);

console.log('=== EVENT TRACE (login -> settle) ===');
for (const e of events.slice(0, 40)) console.log(JSON.stringify(e));
console.log('=== FINAL URL ===', page.url());

const authState = await page.evaluate(() => ({
  localStorage: Object.fromEntries(Object.entries(localStorage)),
  sessionStorageKeys: Object.keys(sessionStorage),
  cookieNames: document.cookie.split(';').map(c => c.trim().split('=')[0]).filter(Boolean),
  bodyTextStart: document.body.innerText.slice(0, 300),
  navLinks: [...document.querySelectorAll('a')].map(a => a.getAttribute('href')).filter(h => h && (h.includes('dashboard') || h.includes('admin') || h.includes('logout') || h.includes('signout') || h.includes('account'))),
  buttons: [...document.querySelectorAll('button')].map(b => (b.textContent || '').trim()).filter(Boolean).slice(0, 20),
}));
console.log('=== AUTH STATE ===');
console.log(JSON.stringify(authState, null, 2));

// Try the dashboard-adjacent routes directly with the token present.
for (const p of ['/dashboard', '/admin']) {
  await page.goto(SRC + p, { waitUntil: 'networkidle', timeout: 30000 }).catch(() => {});
  await page.waitForTimeout(1500);
  const body = await page.evaluate(() => document.body.innerText.replace(/\s+/g, ' ').slice(0, 200));
  console.log(`=== DIRECT ${p} ===`, page.url(), JSON.stringify(body));
}

await browser.close();

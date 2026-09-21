/**
 * Session 32 — source login + authenticated-surface re-probe.
 * Re-traces the source login with the operator-provided credentials to
 * determine whether the source now exposes a dashboard post-login (prior
 * sessions: login → / with no dashboard surface change).
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
  if (u.includes('base44.app') && (r.status() >= 300 || r.status() >= 400 || u.includes('login') || u.includes('auth') || u.includes('session') || u.includes('user') || u.includes('dashboard'))) {
    events.push({ t: 'resp', status: r.status(), url: u.slice(0, 120) });
  }
});

await page.goto(SRC + '/login', { waitUntil: 'networkidle', timeout: 60000 });

// Submit with trace.
await page.locator('input[type="email"], input[name="email"]').first().fill(EMAIL);
await page.locator('input[type="password"], input[name="password"]').first().fill(PASSWORD);
await page.locator('button[type="submit"], button:has-text("Sign in"), button:has-text("Log in"), button:has-text("Login")').first().click();
await page.waitForTimeout(8000); // let the redirect chain settle

console.log('=== EVENT TRACE (login → settle) ===');
for (const e of events.slice(0, 40)) console.log(JSON.stringify(e));

console.log('=== FINAL URL ===', page.url());

// Auth state dump.
const authState = await page.evaluate(() => ({
  localStorage: Object.fromEntries(Object.entries(localStorage)),
  sessionStorageKeys: Object.keys(sessionStorage),
  cookieNames: document.cookie.split(';').map(c => c.trim().split('=')[0]).filter(Boolean),
  bodyTextStart: document.body.innerText.slice(0, 400),
  hasHeaderEl: !!document.querySelector('header'),
  navLinks: [...document.querySelectorAll('a')].map(a => a.getAttribute('href')).filter(h => h && (h.includes('dashboard') || h.includes('admin') || h.includes('logout') || h.includes('signout') || h.includes('account'))),
  buttons: [...document.querySelectorAll('button')].map(b => (b.textContent || '').trim()).filter(Boolean).slice(0, 20),
}));
console.log('=== AUTH STATE ===');
console.log(JSON.stringify(authState, null, 2));

// If we're on the public site, check for ANY auth-gated surface difference:
// avatar, sign-out, dashboard link, edit affordances.
const authChrome = await page.evaluate(() => {
  const sels = [
    '[data-testid*="user"]', '[data-testid*="avatar"]', '[data-testid*="logout"]',
    '[class*="avatar"]', '[class*="Avatar"]', '[aria-label*="Sign out"]', '[aria-label*="Account"]',
    'a[href*="dashboard"]', 'a[href*="admin"]',
  ];
  const found = {};
  for (const s of sels) {
    try {
      const els = document.querySelectorAll(s);
      if (els.length) found[s] = els.length;
    } catch { /* invalid selector */ }
  }
  return found;
});
console.log('=== AUTH CHROME FOUND ===');
console.log(JSON.stringify(authChrome, null, 2));

// Compare the logged-in landing header vs the anonymous one (worklog s28:
// source login → / no dashboard). Look for the top-right area.
const headerSnapshot = await page.evaluate(() => {
  const h = document.querySelector('header') || document.body;
  return {
    headerText: h ? h.innerText.replace(/\s+/g, ' ').slice(0, 300) : null,
    headerLinks: h ? [...h.querySelectorAll('a,button')].map(e => (e.textContent || '').trim()).filter(Boolean).slice(0, 15) : null,
  };
});
console.log('=== HEADER (authed) ===');
console.log(JSON.stringify(headerSnapshot, null, 2));

await browser.close();

/**
 * Session 17 — precise source-login flow trace.
 * Records every navigation + response status around the login submit, then
 * dumps storage/cookie auth state, so we can determine where the base44
 * source app's dashboard actually lives.
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

await page.goto(SRC + '/login', { waitUntil: 'networkidle', timeout: 45000 });

// Dump the login page structure for parity comparison too.
const loginForm = await page.evaluate(() => ({
  headings: [...document.querySelectorAll('h1,h2,h3,h4,label')].map(e => e.textContent.trim()).filter(Boolean).slice(0, 15),
  inputs: [...document.querySelectorAll('input')].map(i => ({ type: i.type, name: i.name, placeholder: i.placeholder, autoComplete: i.autocomplete })),
  buttons: [...document.querySelectorAll('button')].map(b => b.textContent.trim()).filter(Boolean),
  bodyText: document.body.innerText.slice(0, 800),
  links: [...document.querySelectorAll('a')].map(a => ({ href: a.getAttribute('href'), text: a.textContent.trim() })).filter(l => l.text),
}));
console.log('=== LOGIN PAGE ===');
console.log(JSON.stringify(loginForm, null, 2));

// Submit with trace.
await page.locator('input[type="email"], input[name="email"]').first().fill(EMAIL);
await page.locator('input[type="password"], input[name="password"]').first().fill(PASSWORD);
await page.locator('button[type="submit"], button:has-text("Sign in"), button:has-text("Log in"), button:has-text("Login")').first().click();
await page.waitForTimeout(6000); // let the redirect chain settle

console.log('=== EVENT TRACE ===');
for (const e of events.slice(0, 40)) console.log(JSON.stringify(e));

console.log('=== FINAL URL ===', page.url());

// Auth state dump.
const cookies = await ctx.cookies();
const storage = await page.evaluate(() => ({
  localStorage: Object.fromEntries(Object.entries(localStorage).map(([k, v]) => [k, String(v).slice(0, 80)])),
  sessionStorage: Object.fromEntries(Object.entries(sessionStorage).map(([k, v]) => [k, String(v).slice(0, 80)])),
}));
console.log('=== COOKIES ===');
console.log(JSON.stringify(cookies.map(c => ({ name: c.name, domain: c.domain, httpOnly: c.httpOnly, value: c.value.slice(0, 40) })), null, 2));
console.log('=== STORAGE KEYS ===');
console.log(JSON.stringify({ ls: Object.keys(storage.localStorage), ss: Object.keys(storage.sessionStorage) }, null, 2));

// Final page snapshot.
await page.waitForTimeout(1000);
const final = await page.evaluate(() => ({
  h1: document.querySelector('h1')?.textContent?.trim(),
  textHead: document.body.innerText.slice(0, 300),
  buttons: [...document.querySelectorAll('button')].map(b => b.textContent.trim()).filter(Boolean).slice(0, 20),
}));
console.log('=== FINAL PAGE ===');
console.log(JSON.stringify(final, null, 2));
await page.screenshot({ path: 'scripts/out/source-after-login-final.png' });

await browser.close();

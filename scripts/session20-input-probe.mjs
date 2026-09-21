/**
 * Session 20 — precise input-structure probe: source login inputs vs clone.
 */
import { chromium } from 'playwright';

const SRC = 'https://designer-portfolio.base44.app';
const CLONE = 'http://localhost:3000';

const probe = (page) => page.evaluate(() =>
  [...document.querySelectorAll('input,textarea,select')].map((i) => ({
    tag: i.tagName.toLowerCase(),
    type: i.type || '',
    id: i.id || '',
    name: i.name || '',
    placeholder: i.placeholder || '',
    autocomplete: i.autocomplete || '',
  }))
);

const browser = await chromium.launch();

const srcCtx = await browser.newContext({ viewport: { width: 1440, height: 900 } });
const srcPage = await srcCtx.newPage();
await srcPage.goto(SRC + '/login', { waitUntil: 'networkidle', timeout: 45000 });
await srcPage.evaluate(() => { localStorage.removeItem('token'); localStorage.removeItem('base44_access_token'); });
await srcPage.goto(SRC + '/login', { waitUntil: 'networkidle', timeout: 45000 });
const srcInputs = await probe(srcPage);
console.log('SOURCE login inputs:', JSON.stringify(srcInputs, null, 2));

const cloneCtx = await browser.newContext({ viewport: { width: 1440, height: 900 } });
const clonePage = await cloneCtx.newPage();
await clonePage.goto(CLONE + '/login', { waitUntil: 'networkidle', timeout: 45000 });
const cloneInputs = await probe(clonePage);
console.log('CLONE login inputs:', JSON.stringify(cloneInputs, null, 2));

// Also: unknown-slug title on the source (SPA behavior, logged-in + anonymous)
await srcPage.goto(SRC + '/project/nonexistent-slug', { waitUntil: 'networkidle', timeout: 45000 });
await srcPage.waitForTimeout(1500);
console.log('SOURCE unknown-slug title:', JSON.stringify(await srcPage.title()));
console.log('SOURCE unknown-slug URL:', srcPage.url());

await browser.close();

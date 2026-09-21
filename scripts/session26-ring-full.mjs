/**
 * Session 26 — full class + box-shadow capture for keyboard stops 1-8.
 */
import { chromium } from 'playwright';

const CLONE = 'http://localhost:3000';
const SRC = 'https://designer-portfolio.base44.app';

const browser = await chromium.launch();

async function probe(origin) {
  const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 } });
  const page = await ctx.newPage();
  await page.goto(origin, { waitUntil: 'networkidle', timeout: 45000 });
  await page.waitForTimeout(1000);
  const stops = [];
  for (let i = 0; i < 8; i++) {
    await page.keyboard.press('Tab');
    await page.waitForTimeout(80);
    const info = await page.evaluate(() => {
      const el = document.activeElement;
      if (!el || el === document.body) return { tag: 'body' };
      const cs = getComputedStyle(el);
      const label = (el.getAttribute('aria-label') || el.textContent || '').replace(/\s+/g, ' ').trim().slice(0, 24);
      return { tag: el.tagName.toLowerCase(), label, cls: el.className.slice(0, 200), boxShadow: cs.boxShadow };
    });
    stops.push(info);
  }
  await ctx.close();
  return stops;
}

const src = await probe(SRC);
const clone = await probe(CLONE);
for (let i = 0; i < 8; i++) {
  console.log(`--- stop ${i + 1} ---`);
  console.log('SRC  :', JSON.stringify(src[i]));
  console.log('CLONE:', JSON.stringify(clone[i]));
}
await browser.close();

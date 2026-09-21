import { chromium } from 'playwright';
const SRC = 'https://designer-portfolio.base44.app';
const CLONE = 'http://localhost:3000';
const browser = await chromium.launch();
for (const [origin, label] of [[SRC, 'src'], [CLONE, 'clone']]) {
  const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 } });
  const page = await ctx.newPage();
  await page.goto(origin + '/', { waitUntil: 'networkidle', timeout: 60000 });
  await page.waitForTimeout(1200);
  const r = await page.evaluate(() => {
    const describe = (el) => el ? {
      cls: (el.getAttribute('class') || '').slice(0, 110),
      cursor: getComputedStyle(el).cursor,
    } : 'ABSENT';
    const toggle = [...document.querySelectorAll('button')].find(b => b.getAttribute('aria-label') === 'Toggle dark mode');
    const menu = [...document.querySelectorAll('button')].find(b => b.getAttribute('aria-label') === 'Open menu');
    // also: the logo link + CTA + a works row (already pointer) + FAQ trigger on contact
    const logo = document.querySelector('a[href="/"]');
    return { toggle: describe(toggle), menu: describe(menu), logo: describe(logo) };
  });
  console.log(`--- ${label} ---`);
  console.log(JSON.stringify(r, null, 1));
  await ctx.close();
}
// FAQ triggers on /contact
for (const [origin, label] of [[SRC, 'src'], [CLONE, 'clone']]) {
  const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 } });
  const page = await ctx.newPage();
  await page.goto(origin + '/contact', { waitUntil: 'networkidle', timeout: 60000 });
  await page.waitForTimeout(1200);
  const r = await page.evaluate(() => {
    const btns = [...document.querySelectorAll('button')].filter(b => b.offsetParent !== null).slice(0, 6);
    return btns.map(b => ({ text: (b.textContent || '').trim().slice(0, 25), cursor: getComputedStyle(b).cursor, cls: (b.getAttribute('class') || '').slice(0, 90) }));
  });
  console.log(`--- ${label} contact buttons ---`);
  console.log(JSON.stringify(r, null, 1));
  await ctx.close();
}
await browser.close();

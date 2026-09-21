import { chromium } from 'playwright';
const CLONE = 'http://localhost:3000';
const SRC = 'https://designer-portfolio.base44.app';
const browser = await chromium.launch();
for (const [origin, label] of [[SRC, 'src'], [CLONE, 'clone']]) {
  const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 } });
  const page = await ctx.newPage();
  await page.goto(origin + '/', { waitUntil: 'networkidle', timeout: 60000 });
  await page.waitForTimeout(1200);
  const r = await page.evaluate(() => {
    const h = document.querySelector('header');
    const btnInHeader = document.querySelector('header button');
    const toggle = [...document.querySelectorAll('button')].find(b => b.getAttribute('aria-label') === 'Toggle dark mode');
    return {
      hasHeaderTag: !!h,
      headerTagCursor: h ? getComputedStyle(h).cursor : null,
      btnInHeader: !!btnInHeader,
      toggleCursor: toggle ? getComputedStyle(toggle).cursor : 'ABSENT',
      toggleParentTag: toggle?.parentElement?.tagName.toLowerCase(),
    };
  });
  console.log(label, JSON.stringify(r));
  await ctx.close();
}
await browser.close();

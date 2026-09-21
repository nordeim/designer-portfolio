import { chromium } from 'playwright';
const SRC = 'https://designer-portfolio.base44.app';
const browser = await chromium.launch();
const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 } });
const page = await ctx.newPage();
await page.goto(SRC + '/', { waitUntil: 'networkidle', timeout: 60000 });
await page.waitForTimeout(1500);
const detail = await page.evaluate(() => {
  // the footer's bottom row: the flex-col/md:flex-row one holding the copyright
  const rows = [...document.querySelectorAll('footer div')].filter(d => (d.getAttribute('class') || '').startsWith('flex flex-col md:flex-row'));
  const row = rows[rows.length - 1];
  if (!row) return { row: 'ABSENT' };
  const kids = [...row.children].map(c => ({
    tag: c.tagName.toLowerCase(),
    cls: (c.getAttribute('class') || ''),
    text: (c.textContent || '').replace(/\s+/g, ' ').trim().slice(0, 40),
    display: getComputedStyle(c).display,
    href: c.tagName === 'A' ? c.getAttribute('href') : null,
  }));
  return { rowCls: row.getAttribute('class'), kids };
});
console.log(JSON.stringify(detail, null, 1));
await browser.close();

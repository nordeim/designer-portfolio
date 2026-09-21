import { chromium } from 'playwright';
const browser = await chromium.launch();
async function probe(origin) {
  const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 } });
  const page = await ctx.newPage();
  await page.goto(origin + '/contact', { waitUntil: 'networkidle', timeout: 45000 });
  await page.waitForTimeout(1200);
  const out = await page.evaluate(() => {
    const all = [...document.querySelectorAll('button')];
    const first = all.find((b) => (b.textContent || '').trim().length > 15 && (b.textContent || '').trim().endsWith('?'));
    if (!first) return null;
    first.click();
    return new Promise((resolve) => setTimeout(() => {
      const item = first.closest('[data-radix-accordion-item]') || first.closest('div');
      const content = document.querySelector('[data-state="open"][data-radix-accordion-content], [role="region"][data-state="open"]');
      const p = content ? content.querySelector('p') : null;
      const inner = content ? content.firstElementChild : null;
      resolve({
        triggerCls: first.className,
        triggerFs: getComputedStyle(first).fontSize,
        headerCls: first.parentElement.parentElement.className,
        itemCls: item ? item.className : null,
        contentCls: content ? content.className : null,
        innerCls: inner ? inner.className : null,
        innerP: p ? p.className : null,
        chevronCls: first.querySelector('svg') ? first.querySelector('svg').className.baseVal : null,
      });
    }, 800));
  });
  await ctx.close();
  return out;
}
console.log('SRC :', JSON.stringify(await probe('https://designer-portfolio.base44.app'), null, 1));
console.log('CLONE:', JSON.stringify(await probe('http://localhost:3000'), null, 1));
await browser.close();

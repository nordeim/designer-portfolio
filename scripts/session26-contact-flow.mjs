import { chromium } from 'playwright';
const browser = await chromium.launch();
async function probe(origin) {
  const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 } });
  const page = await ctx.newPage();
  await page.goto(origin + '/contact', { waitUntil: 'networkidle', timeout: 45000 });
  await page.waitForTimeout(1200);
  const out = await page.evaluate(() => {
    const res = {};
    // page h1
    const h1 = document.querySelector('h1');
    res.h1 = h1 ? { y: Math.round(h1.getBoundingClientRect().y), fs: getComputedStyle(h1).fontSize, mb: getComputedStyle(h1).marginBottom } : null;
    // form fields
    const inputs = [...document.querySelectorAll('input, textarea, select')];
    res.fields = inputs.slice(0, 6).map((i) => {
      const r = i.getBoundingClientRect();
      const cs = getComputedStyle(i);
      return { tag: i.tagName.toLowerCase(), type: i.type || '', y: Math.round(r.y), h: Math.round(r.height), fs: cs.fontSize, borderB: cs.borderBottomWidth };
    });
    // the form grid (2-col?)
    const form = document.querySelector('form');
    const formCs = form ? getComputedStyle(form) : null;
    res.form = form ? { display: formCs.display, cols: formCs.gridTemplateColumns.slice(0, 40), gap: formCs.gap } : null;
    // submit button
    const submit = document.querySelector('form button[type="submit"], form button:last-child');
    res.submit = submit ? { y: Math.round(submit.getBoundingClientRect().y), h: Math.round(submit.getBoundingClientRect().height), mt: getComputedStyle(submit).marginTop } : null;
    return res;
  });
  await ctx.close();
  return out;
}
console.log('SRC :', JSON.stringify(await probe('https://designer-portfolio.base44.app'), null, 1));
console.log('CLONE:', JSON.stringify(await probe('http://localhost:3000'), null, 1));
await browser.close();

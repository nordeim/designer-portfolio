import { chromium } from 'playwright';
const SRC = 'https://designer-portfolio.base44.app';
const browser = await chromium.launch();
const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 } });
const page = await ctx.newPage();
await page.goto(SRC + '/privacy', { waitUntil: 'networkidle', timeout: 60000 });
await page.waitForTimeout(1500);
const detail = await page.evaluate(() => {
  const h1 = document.querySelector('h1');
  const label = h1?.previousElementSibling;
  const parent = h1?.parentElement;
  const labelRect = label?.getBoundingClientRect();
  const h1Rect = h1?.getBoundingClientRect();
  const cs = label ? getComputedStyle(label) : null;
  return {
    parentTag: parent?.tagName.toLowerCase(),
    parentCls: parent?.getAttribute('class'),
    parentDisplay: parent ? getComputedStyle(parent).display : null,
    labelTag: label?.tagName.toLowerCase(),
    labelCls: label?.getAttribute('class'),
    labelComputed: cs ? {
      display: cs.display, marginTop: cs.marginTop, marginBottom: cs.marginBottom,
      fontSize: cs.fontSize, letterSpacing: cs.letterSpacing, textTransform: cs.textTransform,
      position: cs.position, lineHeight: cs.lineHeight,
    } : null,
    gapLabelToH1: labelRect && h1Rect ? Math.round(h1Rect.top - labelRect.bottom) : null,
    h1Top: h1Rect ? Math.round(h1Rect.top) : null,
  };
});
console.log(JSON.stringify(detail, null, 1));
await browser.close();

import { chromium } from 'playwright';
const SRC = 'https://designer-portfolio.base44.app';
const browser = await chromium.launch();
const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 } });
const page = await ctx.newPage();
await page.goto(SRC + '/', { waitUntil: 'networkidle', timeout: 60000 });
await page.waitForTimeout(1200);
const rules = await page.evaluate(() => {
  const found = [];
  for (const sheet of document.styleSheets) {
    let rules; try { rules = sheet.cssRules; } catch { continue; }
    const walk = (rs) => {
      for (const rule of rs) {
        const t = rule.cssText || '';
        if (t.includes('font-feature') || t.includes('font-variation') || t.includes('font-optical')) {
          found.push(t.slice(0, 200));
        }
        if (rule.cssRules) walk(rule.cssRules);
      }
    };
    walk(rules);
  }
  return found;
});
console.log('=== font feature/variation rules in source stylesheets ===');
console.log(rules.length ? rules.join('\n---\n') : '(none)');
// Also: check the html element + any [class*=font-body] computed features
const spot = await page.evaluate(() => {
  const els = [document.documentElement, document.body, document.querySelector('h1'), document.querySelector('p, span')];
  return els.filter(Boolean).map(el => ({
    tag: el.tagName.toLowerCase(),
    ffs: getComputedStyle(el).fontFeatureSettings,
    fvs: getComputedStyle(el).fontVariationSettings,
    font: getComputedStyle(el).fontFamily.slice(0, 60),
  }));
});
console.log('=== spot computed ===');
console.log(JSON.stringify(spot, null, 1));
await browser.close();

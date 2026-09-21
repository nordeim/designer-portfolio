/**
 * Session 34 — base CSS surface sweep: computed html/body base styles +
 * scroll-behavior + font-smoothing + overflow + user-select on both origins.
 */
import { chromium } from 'playwright';
const SRC = 'https://designer-portfolio.base44.app';
const CLONE = 'http://localhost:3000';
const browser = await chromium.launch();
const out = {};
for (const [origin, label] of [[SRC, 'src'], [CLONE, 'clone']]) {
  const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 } });
  const page = await ctx.newPage();
  await page.goto(origin + '/', { waitUntil: 'networkidle', timeout: 60000 });
  await page.waitForTimeout(1200);
  out[label] = await page.evaluate(() => {
    const html = getComputedStyle(document.documentElement);
    const body = getComputedStyle(document.body);
    const pick = (cs, props) => Object.fromEntries(props.map(p => [p, cs[p]]));
    return {
      html: pick(html, ['scroll-behavior', 'scrollbar-width', 'overflow-x', 'text-size-adjust', 'WebkitFontSmoothing', 'fontFamily']),
      body: pick(body, ['user-select', 'overflow-x', 'text-transform', 'fontFeatureSettings', 'fontKerning', 'textRendering', 'fontSmooth']),
    };
  });
  await ctx.close();
}
const diffs = {};
for (const k of Object.keys(out.src.html)) if (out.src.html[k] !== out.clone.html[k]) diffs['html.' + k] = [out.src.html[k], out.clone.html[k]];
for (const k of Object.keys(out.src.body)) if (out.src.body[k] !== out.clone.body[k]) diffs['body.' + k] = [out.src.body[k], out.clone.body[k]];
console.log('=== BASE CSS DIFFS ===');
console.log(JSON.stringify(diffs, null, 1));
console.log('=== FULL ===');
console.log(JSON.stringify(out, null, 1));
await browser.close();

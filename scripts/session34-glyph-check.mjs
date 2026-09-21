/**
 * Session 34 — glyph-shape empirical check: render the same text at large
 * size on both origins using the loaded Inter, and pixel-compare. Settles
 * whether the clone's "cv11","ss01" font-feature-settings actually changes
 * rendered glyphs vs the source's stock Inter.
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
  await page.waitForTimeout(1000);
  await page.evaluate(() => document.fonts.ready);
  out[label] = await page.evaluate(() => {
    const canvas = document.createElement('canvas');
    canvas.width = 400; canvas.height = 120;
    const ctx2 = canvas.getContext('2d');
    ctx2.font = '80px Inter';
    ctx2.fillStyle = '#000';
    ctx2.textBaseline = 'top';
    ctx2.fillText('a Mango 1', 10, 10);
    // hash the pixel data — use the ALPHA channel (text=255, empty=0)
    const data = ctx2.getImageData(0, 0, 400, 120).data;
    let hash = 0;
    let inked = 0;
    for (let i = 3; i < data.length; i += 4) {
      if (data[i] > 0) { inked++; hash = (hash * 31 + data[i]) % 1000000007; }
    }
    // measure width too
    const w = ctx2.measureText('a Mango 1').width;
    return { hash, inked, w: Math.round(w), ffs: getComputedStyle(document.body).fontFeatureSettings };
  });
  await ctx.close();
}
console.log(JSON.stringify(out, null, 1));
console.log(out.src.hash === out.clone.hash ? 'GLYPHS IDENTICAL (feature settings inert)' : 'GLYPHS DIFFER (real visual divergence)');
await browser.close();

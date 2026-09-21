/**
 * Session 26 — source font loading + measured glyph metrics.
 */
import { chromium } from 'playwright';

const CLONE = 'http://localhost:3000';
const SRC = 'https://designer-portfolio.base44.app';

const browser = await chromium.launch();

async function probe(origin) {
  const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 } });
  const page = await ctx.newPage();
  await page.goto(origin, { waitUntil: 'networkidle', timeout: 45000 });
  await page.waitForTimeout(1500);
  const fonts = await page.evaluate(() => {
    const links = [...document.querySelectorAll('link[rel="stylesheet"], link[as="font"], link[rel="preload"]')].map((l) => l.href).filter((h) => /font|inter|jetbrains/i.test(h));
    const faces = [];
    for (const sheet of document.styleSheets) {
      let rules;
      try { rules = [...sheet.cssRules]; } catch { continue; }
      for (const r of rules) {
        if (r instanceof CSSFontFaceRule) {
          faces.push(`${r.style.getPropertyValue('font-family')} | ${r.style.getPropertyValue('src').slice(0, 120)}`);
        }
      }
    }
    // measure a fixed string width in Inter 30px 300
    const meas = document.createElement('canvas').getContext('2d');
    meas.font = '300 30px Inter';
    const w1 = meas.measureText('Matcha, elevated').width;
    meas.font = '400 16px Inter';
    const w2 = meas.measureText('Kinto is a premium matcha brand rooted in tradition.').width;
    return { links, faces: faces.slice(0, 6), w1: Math.round(w1 * 10) / 10, w2: Math.round(w2 * 10) / 10, fontsLoaded: document.fonts.check('30px Inter') };
  });
  await ctx.close();
  return fonts;
}

console.log('=== SOURCE ===');
console.log(JSON.stringify(await probe(SRC), null, 1));
console.log('=== CLONE ===');
console.log(JSON.stringify(await probe(CLONE), null, 1));
await browser.close();

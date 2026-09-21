/**
 * Session 34 — DOM glyph-shape check v2: inject an identically-styled div
 * ("a Mango 1" at 100px Inter, black on white, fixed geometry) into both
 * sites and compare element screenshots byte-wise. DOM text DOES inherit
 * font-feature-settings, unlike canvas text.
 */
import { chromium } from 'playwright';
import crypto from 'node:crypto';
const SRC = 'https://designer-portfolio.base44.app';
const CLONE = 'http://localhost:3000';
const browser = await chromium.launch();
const shots = {};
for (const [origin, label] of [[SRC, 'src'], [CLONE, 'clone']]) {
  const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 }, deviceScaleFactor: 1 });
  const page = await ctx.newPage();
  await page.goto(origin + '/', { waitUntil: 'networkidle', timeout: 60000 });
  await page.waitForTimeout(1000);
  await page.evaluate(() => document.fonts.ready);
  await page.evaluate(() => {
    const d = document.createElement('div');
    d.id = 'glyph-probe';
    d.textContent = 'a Mango 1';
    d.style.cssText = 'position:fixed;left:100px;top:100px;font-family:Inter,sans-serif;font-size:100px;font-weight:400;color:#000;background:#fff;padding:10px;margin:0;line-height:1;letter-spacing:normal;z-index:99999;font-feature-settings:inherit;';
    document.body.appendChild(d);
  });
  await page.waitForTimeout(300);
  const buf = await page.locator('#glyph-probe').screenshot();
  shots[label] = crypto.createHash('sha256').update(buf).digest('hex').slice(0, 24);
  await ctx.close();
}
console.log('src  :', shots.src);
console.log('clone:', shots.clone);
console.log(shots.src === shots.clone ? 'DOM GLYPHS IDENTICAL' : 'DOM GLYPHS DIFFER — real visual divergence');
await browser.close();

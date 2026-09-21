/**
 * Session 28 — constellation state-machine probe (multi-sample).
 * Samples the hero viewport 12x over ~9s on both sites, capturing every
 * image's rect + alt + count, to compare the cycling constellation's
 * position/size distribution and visible-image count over time.
 */
import { chromium } from 'playwright';

const CLONE = 'http://localhost:3000';
const SRC = 'https://designer-portfolio.base44.app';

const browser = await chromium.launch();

async function sampleHero(origin) {
  const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 } });
  const page = await ctx.newPage();
  await page.goto(origin + '/', { waitUntil: 'networkidle', timeout: 45000 }).catch(() => {});
  await page.waitForTimeout(1200);
  const samples = [];
  for (let i = 0; i < 12; i++) {
    const s = await page.evaluate(() => {
      // all imgs intersecting the hero viewport band (y 0..700), any size
      return Array.from(document.querySelectorAll('img'))
        .map((im) => {
          const r = im.getBoundingClientRect();
          const cs = getComputedStyle(im);
          return {
            alt: (im.alt || '').slice(0, 24),
            x: Math.round(r.x), y: Math.round(r.y),
            w: Math.round(r.width), h: Math.round(r.height),
            op: cs.opacity, vis: cs.display !== 'none' && cs.visibility !== 'hidden' && r.width > 0,
          };
        })
        .filter((im) => im.vis && im.y > -80 && im.y < 700 && im.w > 40 && im.w < 500);
    });
    samples.push(s);
    await page.waitForTimeout(750);
  }
  await ctx.close();
  // aggregate: position/size distribution across samples
  const all = samples.flat();
  const keys = {};
  for (const im of all) {
    const k = `${im.w}x${im.h}@${im.x},${im.y}`;
    keys[k] = (keys[k] || 0) + 1;
  }
  const counts = samples.map((s) => s.length);
  return {
    visibleCountsPerSample: counts,
    uniqueGeometry: Object.keys(keys).length,
    geometryHistogram: Object.entries(keys).sort((a, b) => b[1] - a[1]).slice(0, 12),
    alts: [...new Set(all.map((a) => a.alt))],
    lastSample: samples[samples.length - 1],
  };
}

const out = {
  src: await sampleHero(SRC),
  clone: await sampleHero(CLONE),
};
await browser.close();
console.log(JSON.stringify(out, null, 1));

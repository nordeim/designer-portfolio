/**
 * Session 32 — constellation cycle timers, s28-style fresh sampling.
 * Queries hero-area images fresh each 250ms sample for 30s and derives
 * the show-duration / gap-duration distribution on both origins.
 */
import { chromium } from 'playwright';

const browser = await chromium.launch();

async function probeCycle(origin) {
  const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 } });
  const page = await ctx.newPage();
  await page.goto(origin + '/', { waitUntil: 'networkidle', timeout: 60000 }).catch(() => {});
  await page.waitForTimeout(200);
  const out = await page.evaluate(async () => {
    const snap = () => Array.from(document.querySelectorAll('img'))
      .map((im) => {
        const r = im.getBoundingClientRect();
        const cs = getComputedStyle(im);
        return { cx: Math.round(r.x + r.width / 2), cy: Math.round(r.y + r.height / 2), w: Math.round(r.width), vis: cs.display !== 'none' && cs.visibility !== 'hidden' && r.width > 0 && cs.opacity !== '0' };
      })
      .filter((im) => im.vis && im.cy > -80 && im.cy < 700 && im.w > 40 && im.w < 500);
    const N = 120, DT = 250;
    const samples = [];
    for (let k = 0; k < N; k++) {
      const ims = snap();
      samples.push(ims.map((i) => `${i.cx},${i.cy}`).join(';'));
      await new Promise((r) => setTimeout(r, DT));
    }
    const runs = [];
    let cur = null;
    for (let k = 0; k < N; k++) {
      const v = samples[k] !== '';
      if (v && cur) cur.len++;
      else if (v && !cur) { cur = { startK: k, len: 1 }; runs.push(cur); }
      else cur = null;
    }
    const gaps = [];
    for (let i = 1; i < runs.length; i++) gaps.push((runs[i].startK - (runs[i - 1].startK + runs[i - 1].len)) * DT);
    const showDurs = runs.map((r) => r.len * DT);
    let switches = 0;
    for (let k = 1; k < N; k++) if (samples[k] !== '' && samples[k - 1] !== '' && samples[k] !== samples[k - 1]) switches++;
    return {
      emptyPct: Math.round((samples.filter((s) => s === '').length / N) * 100),
      runs: runs.length,
      showRange: showDurs.length ? [Math.min(...showDurs), Math.max(...showDurs)] : null,
      showAvg: showDurs.length ? Math.round(showDurs.reduce((a, b) => a + b, 0) / showDurs.length) : null,
      gapRange: gaps.length ? [Math.min(...gaps), Math.max(...gaps)] : null,
      gapAvg: gaps.length ? Math.round(gaps.reduce((a, b) => a + b, 0) / gaps.length) : null,
      firstAt: samples.findIndex((s) => s !== '') * DT,
      slotSwitches: switches,
    };
  }).catch((e) => ({ error: String(e).slice(0, 300) }));
  await ctx.close();
  return out;
}

console.log('=== CYCLE (src) ===');
console.log(JSON.stringify(await probeCycle('https://designer-portfolio.base44.app')));
console.log('=== CYCLE (clone) ===');
console.log(JSON.stringify(await probeCycle('http://localhost:3000')));
await browser.close();

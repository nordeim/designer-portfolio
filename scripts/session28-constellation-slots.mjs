/**
 * Session 28 — patient constellation enumeration + contact h1 mobile classes.
 *
 * A. 40 samples x 600ms on the source landing: enumerate the full floating
 *    slot table (col, y%, size) as center-normalized geometry, then the same
 *    on the clone for a table-level diff.
 * B. Source + clone contact page at 390px: the h1's exact class list +
 *    computed fs/lh (the mobile line-height divergence: 45 vs 40px).
 * C. Typewriter fine timing: 60ms sampling for 12s on both sites, deriving
 *    the per-char interval distribution while text grows.
 */
import { chromium } from 'playwright';

const CLONE = 'http://localhost:3000';
const SRC = 'https://designer-portfolio.base44.app';

const browser = await chromium.launch();

// ---------- A. patient constellation enumeration ----------
async function enumerateSlots(origin) {
  const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 } });
  const page = await ctx.newPage();
  await page.goto(origin + '/', { waitUntil: 'networkidle', timeout: 45000 }).catch(() => {});
  await page.waitForTimeout(1500);
  const seen = {};
  for (let i = 0; i < 40; i++) {
    const ims = await page.evaluate(() => {
      return Array.from(document.querySelectorAll('img'))
        .map((im) => {
          const r = im.getBoundingClientRect();
          const cs = getComputedStyle(im);
          return { x: r.x, y: r.y, w: r.width, h: r.height, vis: cs.display !== 'none' && cs.visibility !== 'hidden' && r.width > 0 && cs.opacity !== '0', op: cs.opacity };
        })
        .filter((im) => im.vis && im.y > -80 && im.y < 700 && im.w > 40 && im.w < 500);
    });
    for (const im of ims) {
      const cx = Math.round(im.x + im.w / 2);
      const cy = Math.round(im.y + im.h / 2);
      const col = (cx / 1440) * 12;
      const yPct = (cy / 900) * 100;
      const key = `col≈${col.toFixed(1)} y≈${yPct.toFixed(0)}% ${Math.round(im.w)}x${Math.round(im.h)}`;
      seen[key] = (seen[key] || 0) + 1;
    }
    await page.waitForTimeout(600);
  }
  await ctx.close();
  return Object.entries(seen).sort((a, b) => b[1] - a[1]);
}

// ---------- B. contact h1 mobile classes ----------
async function contactH1(origin) {
  const ctx = await browser.newContext({ viewport: { width: 390, height: 844 } });
  const page = await ctx.newPage();
  await page.goto(origin + '/contact', { waitUntil: 'networkidle', timeout: 45000 }).catch(() => {});
  await page.waitForTimeout(1200);
  const out = await page.evaluate(() => {
    const h1 = document.querySelector('h1');
    if (!h1) return null;
    const cs = getComputedStyle(h1);
    return { cls: h1.className, fs: cs.fontSize, lh: cs.lineHeight, fw: cs.fontWeight };
  });
  await ctx.close();
  return out;
}

// ---------- C. typewriter fine timing ----------
async function typewriterTiming(origin) {
  const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 } });
  const page = await ctx.newPage();
  await page.goto(origin + '/', { waitUntil: 'networkidle', timeout: 45000 }).catch(() => {});
  await page.waitForTimeout(600);
  const out = await page.evaluate(() => new Promise((resolve) => {
    // The typewriter line: the LAST mono element in the hero meta block (the one with the | caret or growing text)
    let el = null;
    // find elements whose text grows: sample candidates then pick the one that changes
    const cands = Array.from(document.querySelectorAll('span, p, div')).filter((e) => {
      const t = (e.textContent || '');
      return t.includes('|') || /@$/.test(t) || t.length < 60;
    }).slice(0, 200);
    let prevLens = cands.map((e) => e.textContent.length);
    const samples = [];
    const start = performance.now();
    const iv = setInterval(() => {
      // pick the candidate whose length changed most recently
      let best = null; let bestDelta = 0;
      cands.forEach((e, i) => {
        const d = Math.abs(e.textContent.length - prevLens[i]);
        if (d > bestDelta) { bestDelta = d; best = e; }
        prevLens[i] = e.textContent.length;
      });
      if (best) el = best;
      if (el) samples.push({ t: Math.round(performance.now() - start), len: el.textContent.replace('|', '').length, text: el.textContent.slice(0, 40) });
      if (samples.length >= 200) {
        clearInterval(iv);
        const grows = [];
        let last = null;
        for (const s of samples) {
          if (last && s.len === last.len + 1) grows.push(s.t - last.t);
          last = s;
        }
        const shrinks = [];
        last = null;
        for (const s of samples) {
          if (last && s.len === last.len - 1) shrinks.push(s.t - last.t);
          last = s;
        }
        resolve({
          samplesMs: samples[samples.length - 1].t,
          growCount: grows.length,
          growMedian: grows.length ? grows.slice().sort((a, b) => a - b)[Math.floor(grows.length / 2)] : null,
          shrinkCount: shrinks.length,
          distinctLens: [...new Set(samples.map((s) => s.len))].slice(0, 60),
          textSeries: [...new Set(samples.map((s) => s.text))].slice(0, 30),
        });
      }
    }, 60);
  }));
  await ctx.close();
  return out;
}

const report = {
  slots: {
    src: await enumerateSlots(SRC),
    clone: await enumerateSlots(CLONE),
  },
  contactH1: {
    src: await contactH1(SRC),
    clone: await contactH1(CLONE),
  },
  typewriter: {
    src: await typewriterTiming(SRC),
    clone: await typewriterTiming(CLONE),
  },
};

await browser.close();
console.log(JSON.stringify(report, null, 1));

/**
 * Session 32 — reduced-motion JS-machine probe.
 * The source keeps CSS animations RUNNING at 1e-05s under reduce. Question:
 * do its JS machines (typewriter, constellation cycling, logo breathing)
 * also keep running? And what does the clone do? Sample each machine's
 * state over 12s under emulated reduce.
 */
import { chromium } from 'playwright';

const browser = await chromium.launch();

async function probeMachines(origin) {
  const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 }, reducedMotion: 'reduce' });
  const page = await ctx.newPage();
  await page.goto(origin + '/', { waitUntil: 'networkidle', timeout: 60000 }).catch(() => {});
  await page.waitForTimeout(1500);
  const out = await page.evaluate(async () => {
    const snap = () => {
      // typewriter meta line: the span whose text mutates (under the h1)
      const meta = [...document.querySelectorAll('span, p')].filter((e) => {
        const t = e.textContent;
        return /BASED:|GRAPHIC|HELLO@/i.test(t) && t.length < 60 && e.children.length <= 1;
      }).map((e) => e.textContent);
      // constellation: count VISIBLE hero-area images
      const imgs = [...document.querySelectorAll('img')].filter((i) => {
        const r = i.getBoundingClientRect();
        const cs = getComputedStyle(i);
        return r.top < 700 && r.width > 50 && r.height > 50 && cs.opacity !== '0' && cs.display !== 'none' && !i.src.includes('logo');
      }).map((i) => i.src.split('/').slice(-2).join('/').slice(0, 40));
      // logo breathing: letter-spacing of the A/M logo
      const logo = [...document.querySelectorAll('a, span, div')].find((e) => /^A\/?M$/i.test((e.textContent || '').trim()) && e.textContent.trim().length <= 4);
      const ls = logo ? getComputedStyle(logo).letterSpacing : null;
      return { meta: meta.join(' § ').slice(0, 80), imgCount: imgs.length, imgKey: imgs.slice(0, 3).join(','), logoLs: ls };
    };
    const a = snap();
    await new Promise((r) => setTimeout(r, 6000));
    const b = snap();
    await new Promise((r) => setTimeout(r, 6000));
    const c = snap();
    return {
      t0: a, t6: b, t12: c,
      typewriterMoves: a.meta !== b.meta || b.meta !== c.meta,
      constellationCycles: a.imgKey !== b.imgKey || b.imgKey !== c.imgKey || a.imgCount !== b.imgCount,
      logoBreathes: a.logoLs !== b.logoLs || b.logoLs !== c.logoLs,
      samples: { a, b, c },
    };
  }).catch((e) => ({ error: String(e).slice(0, 300) }));
  await ctx.close();
  return out;
}

const src = await probeMachines('https://designer-portfolio.base44.app');
console.log('=== SOURCE (reduced motion) ===');
console.log(JSON.stringify(src, null, 1));
const clone = await probeMachines('http://localhost:3000');
console.log('=== CLONE (reduced motion) ===');
console.log(JSON.stringify(clone, null, 1));
await browser.close();

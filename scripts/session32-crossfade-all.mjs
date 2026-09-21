/**
 * Session 32 — preview crossfade, ALL elements tracked.
 * On row-switch, track every preview-sized fixed/absolute element's
 * opacity+position at rAF speed to characterize BOTH the exit and the
 * enter profile of the source's cursor preview.
 */
import { chromium } from 'playwright';

const browser = await chromium.launch();

async function probeCrossfade(origin) {
  const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 } });
  const page = await ctx.newPage();
  await page.goto(origin + '/projects', { waitUntil: 'networkidle', timeout: 60000 }).catch(() => {});
  await page.waitForTimeout(2000);
  const rows = page.locator('a[href*="/project/"]');
  await rows.nth(0).hover();
  await page.waitForTimeout(700);
  const row1box = await rows.nth(1).boundingBox();
  await page.mouse.move(row1box.x + row1box.width / 2, row1box.y + 20);
  const out = await page.evaluate(async () => {
    const findAll = () => [...document.querySelectorAll('img, div')].filter((d) => {
      const cs = getComputedStyle(d);
      const r = d.getBoundingClientRect();
      const z = parseInt(cs.zIndex || '0', 10);
      return (cs.position === 'fixed' || cs.position === 'absolute') && z > 10 && r.width >= 150 && r.width <= 500 && r.height >= 100 && r.height <= 400;
    }).map((el) => {
      const r = el.getBoundingClientRect();
      const cs = getComputedStyle(el);
      return { y: Math.round(r.y), op: +(+cs.opacity).toFixed(3), sc: cs.transform !== 'none' ? +cs.transform.match(/matrix\(([\d.]+)/)?.[1] : 1 };
    });
    const timeline = [];
    const t0 = performance.now();
    for (let k = 0; k < 45; k++) {
      timeline.push({ t: Math.round(performance.now() - t0), els: findAll() });
      await new Promise((r) => requestAnimationFrame(() => r()));
    }
    // compress: keep frames where the element SET changes or an opacity moves
    const key = (f) => f.els.map((e) => `${e.y}:${e.op}`).join('|');
    const changes = [];
    let last = null;
    for (const f of timeline) {
      const k = key(f);
      if (k !== last) { changes.push(f); last = k; }
    }
    return { first: timeline[0], last: timeline[timeline.length - 1], timeline: changes.slice(0, 18) };
  }).catch((e) => ({ error: String(e).slice(0, 300) }));
  await ctx.close();
  return out;
}

console.log('=== CROSSFADE ALL (src) ===');
console.log(JSON.stringify(await probeCrossfade('https://designer-portfolio.base44.app')));
console.log('=== CROSSFADE ALL (clone) ===');
console.log(JSON.stringify(await probeCrossfade('http://localhost:3000')));
await browser.close();

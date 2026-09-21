/**
 * Session 32 — radial-menu OPEN animation profile @ rAF sampling.
 * Samples the overlay + first link's opacity/transform from the click
 * moment to catch the enter animation the 60ms sampler missed.
 */
import { chromium } from 'playwright';

const browser = await chromium.launch();

async function probeMenuOpen(origin) {
  const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 } });
  const page = await ctx.newPage();
  await page.goto(origin + '/', { waitUntil: 'networkidle', timeout: 60000 }).catch(() => {});
  await page.waitForTimeout(2000);
  // click the visible menu button
  await page.evaluate(() => {
    const btns = [...document.querySelectorAll('button')].filter((b) => (b.textContent || '').trim().toLowerCase() === 'menu');
    const vis = btns.find((b) => b.offsetParent !== null);
    if (vis) vis.click();
  });
  const out = await page.evaluate(async () => {
    const findOverlay = () => {
      const overlays = [...document.querySelectorAll('div')].filter((d) => {
        const cs = getComputedStyle(d);
        return cs.position === 'fixed' && (parseInt(cs.zIndex || '0', 10) >= 40) && d.offsetWidth > innerWidth * 0.9 && d.offsetHeight > innerHeight * 0.9;
      });
      return overlays[0] || null;
    };
    const samples = [];
    const t0 = performance.now();
    for (let k = 0; k < 40; k++) {
      const ov = findOverlay();
      if (ov) {
        const cs = getComputedStyle(ov);
        const first = ov.querySelector('a, nav, [class*="item"], li, button');
        const fcs = first ? getComputedStyle(first) : null;
        const fr = first ? first.getBoundingClientRect() : null;
        samples.push({
          t: Math.round(performance.now() - t0),
          op: +(+cs.opacity).toFixed(3),
          tr: cs.transform !== 'none' ? cs.transform.slice(0, 36) : 'none',
          itemOp: fcs ? +(+fcs.opacity).toFixed(3) : null,
          itemTr: fcs && fcs.transform !== 'none' ? fcs.transform.slice(0, 36) : 'none',
          itemY: fr ? Math.round(fr.y) : null,
        });
      }
      await new Promise((r) => requestAnimationFrame(() => r()));
    }
    // keep only change moments + first/last
    const changes = [];
    let lastOp = null, lastItemOp = null;
    for (const s of samples) {
      if (s.op !== lastOp || s.itemOp !== lastItemOp) { changes.push(s); lastOp = s.op; lastItemOp = s.itemOp; }
    }
    return { first: samples[0] || null, last: samples[samples.length - 1] || null, timeline: changes.slice(0, 16), total: samples.length };
  }).catch((e) => ({ error: String(e).slice(0, 300) }));
  await ctx.close();
  return out;
}

console.log('=== MENU OPEN (src) ===');
console.log(JSON.stringify(await probeMenuOpen('https://designer-portfolio.base44.app')));
console.log('=== MENU OPEN (clone) ===');
console.log(JSON.stringify(await probeMenuOpen('http://localhost:3000')));
await browser.close();

/**
 * Session 26 — GSAP pin behavior vs CSS sticky: measure the pinned child
 * element (inside pin-spacer) at multiple scroll offsets.
 */
import { chromium } from 'playwright';

const CLONE = 'http://localhost:3000';
const SRC = 'https://designer-portfolio.base44.app';
const PROJECT = '/project/kinto-cafe-branding';

const browser = await chromium.launch();

async function probe(origin) {
  const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 } });
  const page = await ctx.newPage();
  await page.goto(origin + PROJECT, { waitUntil: 'networkidle', timeout: 45000 });
  await page.waitForTimeout(1800); // GSAP ScrollTrigger init + refresh
  const positions = [];
  for (const scrollY of [0, 800, 1600, 2400, 3200, 4000, 4800]) {
    await page.evaluate((y) => window.scrollTo(0, y), scrollY);
    await page.waitForTimeout(400);
    const pos = await page.evaluate(() => {
      const grid = [...document.querySelectorAll('div')].find((d) => /hidden md:grid grid-cols-12/.test(d.className.toString()));
      if (!grid) return null;
      const first = grid.children[0];
      // find the visual intro: the pin-spacer's child OR the sticky col-span-4
      let intro = first;
      if (/pin-spacer/.test(first.className.toString())) {
        intro = first.querySelector(':scope > *');
        // GSAP may wrap twice
        while (intro && /pin-spacer/.test(intro.className.toString())) intro = intro.firstElementChild;
      }
      if (!intro) return null;
      const r = intro.getBoundingClientRect();
      const cs = getComputedStyle(intro);
      return { y: Math.round(r.y), h: Math.round(r.height), position: cs.position, spacerY: Math.round(first.getBoundingClientRect().y), spacerH: Math.round(first.getBoundingClientRect().height), cls: intro.className.toString().slice(0, 50) };
    });
    positions.push({ scrollY, ...pos });
  }
  // intro internals
  const internals = await page.evaluate(() => {
    const grid = [...document.querySelectorAll('div')].find((d) => /hidden md:grid grid-cols-12/.test(d.className.toString()));
    if (!grid) return null;
    let intro = grid.children[0];
    if (/pin-spacer/.test(intro.className.toString())) intro = intro.querySelector(':scope > *') || intro;
    const h2 = intro.querySelector('h2, h3');
    const p = intro.querySelector('p');
    const span = intro.querySelector('span');
    const m = (el) => el ? (() => { const cs = getComputedStyle(el); const r = el.getBoundingClientRect(); return { fs: cs.fontSize, lh: cs.lineHeight, fw: cs.fontWeight, mb: cs.marginBottom, w: Math.round(r.width), h: Math.round(r.height) }; })() : null;
    return { h2: m(h2), p: m(p), span: m(span) };
  });
  await ctx.close();
  return { positions, internals };
}

console.log('=== SOURCE ===');
console.log(JSON.stringify(await probe(SRC), null, 1));
console.log('=== CLONE ===');
console.log(JSON.stringify(await probe(CLONE), null, 1));
await browser.close();

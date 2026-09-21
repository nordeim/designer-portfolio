/**
 * Session 28 — display-heading mobile line-height audit.
 * The source keeps `leading-tight` on display h1s; in Tailwind v3 the
 * responsive text-* variants (emitted after base utilities) override it at
 * md+/lg, so it only WINS below 768px (36px × 1.25 = 45px). The session-26
 * clone fix dropped leading-tight entirely, which matched desktop (72/60px)
 * but left mobile at v4's default 40px instead of 45px.
 *
 * Probes: contact h1, about h1, projects h1, legal h1s, detail h1/h2 —
 * at 390px AND 1440px, both sites: fs, lh, and the full class list.
 */
import { chromium } from 'playwright';

const CLONE = 'http://localhost:3000';
const SRC = 'https://designer-portfolio.base44.app';

const browser = await chromium.launch();

async function probeHeadings(origin, path, vp) {
  const ctx = await browser.newContext({ viewport: vp });
  const page = await ctx.newPage();
  await page.goto(origin + path, { waitUntil: 'networkidle', timeout: 45000 }).catch(() => {});
  await page.waitForTimeout(1500);
  const out = await page.evaluate(() => {
    const grab = (sel) => {
      const el = document.querySelector(sel);
      if (!el) return null;
      const cs = getComputedStyle(el);
      return { cls: el.className.replace(/\s+/g, ' ').slice(0, 200), fs: cs.fontSize, lh: cs.lineHeight, fw: cs.fontWeight, text: el.textContent.trim().slice(0, 40) };
    };
    return {
      h1: grab('h1'),
      h2: grab('h2'),
      h3: grab('h3'),
    };
  });
  await ctx.close();
  return out;
}

const routes = ['/contact', '/about', '/projects', '/privacy', '/accessibility', '/project/kinto-cafe-branding'];
const report = {};
for (const route of routes) {
  report[route] = {
    mobile: {
      src: await probeHeadings(SRC, route, { width: 390, height: 844 }),
      clone: await probeHeadings(CLONE, route, { width: 390, height: 844 }),
    },
    desktop: {
      src: await probeHeadings(SRC, route, { width: 1440, height: 900 }),
      clone: await probeHeadings(CLONE, route, { width: 1440, height: 900 }),
    },
  };
}

await browser.close();
console.log(JSON.stringify(report, null, 1));

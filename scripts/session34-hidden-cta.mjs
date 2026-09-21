/**
 * Session 34 — hidden-CTA context probe + ::selection rule scan.
 *   1. The source's hidden trailing "Start a Project →" anchor: parent
 *      chain, class, inline style, visibility at mobile, position in DOM.
 *   2. ::selection rules in the source stylesheets (any element).
 *   3. The source's --color-sage value (for our scrollbar replication).
 *   4. Whether the clone's hidden A/M duplicate matches the source's
 *      (parent context for both).
 */
import { chromium } from 'playwright';

const CLONE = 'http://localhost:3000';
const SRC = 'https://designer-portfolio.base44.app';
const browser = await chromium.launch();

async function withPage(origin, path, vp, fn, settle = 1500) {
  const ctx = await browser.newContext({ viewport: vp });
  const page = await ctx.newPage();
  await page.goto(origin + path, { waitUntil: 'networkidle', timeout: 60000 }).catch(() => {});
  await page.waitForTimeout(settle);
  let out;
  try { out = await fn(page); } catch (e) { out = { error: String(e).slice(0, 300) }; }
  await ctx.close();
  return out;
}

console.log('=== 1. HIDDEN CTA CONTEXT (desktop + mobile) ===');
for (const vp of [{ width: 1440, height: 900 }, { width: 390, height: 844 }]) {
  for (const [origin, label] of [[SRC, 'src'], [CLONE, 'clone']]) {
    const info = await withPage(origin, '/', vp, async (page) => page.evaluate(() => {
      const out = [];
      // every anchor whose visible text is the CTA text
      for (const a of document.querySelectorAll('a')) {
        const t = (a.textContent || '').replace(/\s+/g, ' ').trim();
        if (t.includes('Start a Project')) {
          const r = a.getBoundingClientRect();
          const chain = [];
          let el = a.parentElement;
          for (let i = 0; i < 4 && el; i++, el = el.parentElement) {
            chain.push(`${el.tagName.toLowerCase()}.${(el.getAttribute('class') || '').slice(0, 50)}`);
          }
          out.push({
            href: a.getAttribute('href'),
            rect: { x: Math.round(r.x), y: Math.round(r.y), w: Math.round(r.width), h: Math.round(r.height) },
            visible: a.offsetParent !== null,
            display: getComputedStyle(a).display,
            cls: (a.getAttribute('class') || '').slice(0, 80),
            style: (a.getAttribute('style') || '').slice(0, 80),
            parentChain: chain,
            ariaHidden: a.getAttribute('aria-hidden'),
            tabIndex: a.getAttribute('tabindex'),
            isLastBodyChild: a.closest('body > *')?.tagName,
          });
        }
      }
      return out;
    }));
    console.log(`--- ${label} @ ${vp.width}px ---`);
    for (const i of info) console.log(JSON.stringify(i));
  }
}

console.log('=== 2. ::selection RULES (source) ===');
const selRules = await withPage(SRC, '/', { width: 1440, height: 900 }, async (page) => page.evaluate(() => {
  const found = [];
  for (const sheet of document.styleSheets) {
    let rules; try { rules = sheet.cssRules; } catch { continue; }
    const walk = (rs) => {
      for (const rule of rs) {
        const sel = rule.selectorText || '';
        if (sel.includes('::selection') || sel.includes('::-moz-selection')) found.push(rule.cssText.slice(0, 160));
        if (rule.cssRules) walk(rule.cssRules);
      }
    };
    walk(rules);
  }
  return found;
}));
console.log(selRules.length ? selRules.join('\n') : '(none)');

console.log('=== 3. SOURCE --color-sage VALUE ===');
const sage = await withPage(SRC, '/', { width: 1440, height: 900 }, async (page) => page.evaluate(() => {
  const cs = getComputedStyle(document.documentElement);
  return {
    colorSage: cs.getPropertyValue('--color-sage').trim(),
    sage: cs.getPropertyValue('--sage').trim(),
  };
}));
console.log(JSON.stringify(sage));

console.log('=== 4. CLONE SAGE TOKENS ===');
const sageC = await withPage(CLONE, '/', { width: 1440, height: 900 }, async (page) => page.evaluate(() => {
  const cs = getComputedStyle(document.documentElement);
  return {
    colorSage: cs.getPropertyValue('--color-sage').trim(),
    sage: cs.getPropertyValue('--sage').trim(),
  };
}));
console.log(JSON.stringify(sageC));

await browser.close();

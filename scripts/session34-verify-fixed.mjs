/**
 * Session 34 — final parity re-verification (fixed clone vs source).
 * Every fixed surface re-probed on both origins:
 *   ::selection, scrollbar rules, button cursors, legal label texture,
 *   footer anchor count/structure, html font stack, font features,
 *   theme machine, and the anchor inventory delta.
 */
import { chromium } from 'playwright';

const CLONE = 'http://localhost:3000';
const SRC = 'https://designer-portfolio.base44.app';
const browser = await chromium.launch();

async function withPage(origin, path, fn, opts = {}) {
  const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 }, colorScheme: opts.colorScheme });
  const page = await ctx.newPage();
  await page.goto(origin + path, { waitUntil: 'networkidle', timeout: 60000 }).catch(() => {});
  await page.waitForTimeout(1500);
  let out;
  try { out = await fn(page); } catch (e) { out = { error: String(e).slice(0, 200) }; }
  await ctx.close();
  return out;
}

const probe = {
  selection: (p) => p.evaluate(() => getComputedStyle(document.querySelector('h1'), '::selection').backgroundColor),
  ffs: (p) => p.evaluate(() => getComputedStyle(document.body).fontFeatureSettings),
  htmlFont: (p) => p.evaluate(() => getComputedStyle(document.documentElement).fontFamily),
  scrollbar: (p) => p.evaluate(() => {
    const rules = [];
    for (const sheet of document.styleSheets) {
      let rs; try { rs = sheet.cssRules; } catch { continue; }
      const walk = (list) => {
        for (const rule of list) {
          const sr = rule;
          if ((sr.selectorText || '').match(/^::-webkit-scrollbar(-track|-thumb)?$/)) rules.push(rule.cssText.replace(/\s+/g, ' '));
          const nested = rule.cssRules;
          if (nested) walk(nested);
        }
      };
      walk(rs);
    }
    return rules.sort();
  }),
  cursors: (p) => p.evaluate(() => {
    const btn = (label) => [...document.querySelectorAll('button')].find(b => b.getAttribute('aria-label') === label);
    return {
      toggle: btn('Toggle dark mode') ? getComputedStyle(btn('Toggle dark mode')).cursor : 'ABSENT',
      menu: btn('Open menu') ? getComputedStyle(btn('Open menu')).cursor : 'ABSENT',
    };
  }),
  legalLabel: (p) => p.evaluate(() => {
    const h1 = document.querySelector('h1');
    const el = h1?.previousElementSibling;
    if (!el) return null;
    const cs = getComputedStyle(el);
    return { tag: el.tagName, text: el.textContent, transform: cs.textTransform, display: cs.display, mb: cs.marginBottom };
  }),
  contactAnchors: (p) => p.evaluate(() => {
    const links = [...document.querySelectorAll('a[href="/contact"]')];
    const hidden = links.filter(a => getComputedStyle(a).display === 'none');
    return { total: links.length, hidden: hidden.length, hiddenText: (hidden[0]?.textContent || '').replace(/\s+/g, ' ').trim(), hiddenFirst: hidden[0]?.parentElement?.firstElementChild === hidden[0] };
  }),
  anchorCount: (p) => p.evaluate(() => document.querySelectorAll('a').length),
};

const results = {};
for (const [origin, label] of [[SRC, 'src'], [CLONE, 'clone']]) {
  results[label] = {
    selection: await withPage(origin, '/', probe.selection),
    ffs: await withPage(origin, '/', probe.ffs),
    htmlFont: await withPage(origin, '/', probe.htmlFont),
    scrollbar: await withPage(origin, '/', probe.scrollbar),
    cursors: await withPage(origin, '/', probe.cursors),
    contactButtons: await withPage(origin, '/contact', (p) => p.evaluate(() => {
      const submit = [...document.querySelectorAll('button')].find(b => (b.textContent || '').trim().startsWith('Send Inquiry'));
      const trigger = [...document.querySelectorAll('button')].find(b => (b.textContent || '').includes('Select a type'));
      return { submit: submit ? getComputedStyle(submit).cursor : 'ABSENT', trigger: trigger ? getComputedStyle(trigger).cursor : 'ABSENT' };
    })),
    legalLabel: await withPage(origin, '/privacy', probe.legalLabel),
    contactAnchors: await withPage(origin, '/', probe.contactAnchors),
    anchorCount: await withPage(origin, '/', probe.anchorCount),
  };
}

const s = results.src, c = results.clone;
// LightningCSS (Tailwind v4's minifier) rewrites `background: transparent`
// as `background: 0px 0px` — IDENTICAL rendered value, different source
// serialization (Chromium's cssText reflects the parsed declaration). The
// source ships the unminified keyword. Normalize before comparing.
const norm = (rules) => rules.map(r => r.replace('background: 0px 0px', 'background: transparent'));
const checks = [
  ['::selection bg', s.selection === c.selection, `${JSON.stringify(s.selection)} vs ${JSON.stringify(c.selection)}`],
  ['font-feature-settings', s.ffs === c.ffs, `${JSON.stringify(s.ffs)} vs ${JSON.stringify(c.ffs)}`],
  ['html font stack', s.htmlFont === c.htmlFont, `${JSON.stringify(s.htmlFont)} vs ${JSON.stringify(c.htmlFont)}`],
  ['scrollbar rules', JSON.stringify(norm(s.scrollbar)) === JSON.stringify(norm(c.scrollbar)), `${JSON.stringify(s.scrollbar)} vs ${JSON.stringify(c.scrollbar)}`],
  ['chrome cursors', JSON.stringify(s.cursors) === JSON.stringify(c.cursors), `${JSON.stringify(s.cursors)} vs ${JSON.stringify(c.cursors)}`],
  ['contact button cursors', JSON.stringify(s.contactButtons) === JSON.stringify(c.contactButtons), `${JSON.stringify(s.contactButtons)} vs ${JSON.stringify(c.contactButtons)}`],
  ['legal label texture', JSON.stringify(s.legalLabel) === JSON.stringify(c.legalLabel), `${JSON.stringify(s.legalLabel)} vs ${JSON.stringify(c.legalLabel)}`],
  ['contact anchor inventory', JSON.stringify(s.contactAnchors) === JSON.stringify(c.contactAnchors), `${JSON.stringify(s.contactAnchors)} vs ${JSON.stringify(c.contactAnchors)}`],
  ['total anchor count', s.anchorCount === c.anchorCount, `${s.anchorCount} vs ${c.anchorCount}`],
];
let allPass = true;
for (const [name, ok, detail] of checks) {
  console.log(`${ok ? 'PASS' : 'FAIL'}  ${name}${ok ? '' : '  —  ' + detail}`);
  if (!ok) allPass = false;
}
console.log(allPass ? '\n=== ALL FIXED SURFACES AT PARITY ===' : '\n=== DIVERGENCES REMAIN ===');
await browser.close();

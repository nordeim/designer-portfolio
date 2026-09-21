/**
 * Session 34 — targeted follow-up probes:
 *   1. The extra anchor on every source route (1 more <a> than the clone).
 *   2. The source's custom ::-webkit-scrollbar values (width/thumb/track).
 *   3. The legal breadcrumb "Legal" vs "LEGAL" DOM text case.
 *   4. The contact-page input delta (honeypot?).
 */
import { chromium } from 'playwright';

const CLONE = 'http://localhost:3000';
const SRC = 'https://designer-portfolio.base44.app';
const browser = await chromium.launch();

async function withPage(origin, path, fn, settle = 1500) {
  const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 } });
  const page = await ctx.newPage();
  await page.goto(origin + path, { waitUntil: 'networkidle', timeout: 60000 }).catch(() => {});
  await page.waitForTimeout(settle);
  let out;
  try { out = await fn(page); } catch (e) { out = { error: String(e).slice(0, 300) }; }
  await ctx.close();
  return out;
}

// 1. Full anchor inventory with text/href/geometry on '/' both origins.
console.log('=== 1. ANCHOR INVENTORY (landing) ===');
for (const [origin, label] of [[SRC, 'src'], [CLONE, 'clone']]) {
  const anchors = await withPage(origin, '/', async (page) => page.evaluate(() => {
    return [...document.querySelectorAll('a')].map(a => {
      const r = a.getBoundingClientRect();
      return {
        href: a.getAttribute('href'),
        text: (a.textContent || '').replace(/\s+/g, ' ').trim().slice(0, 30),
        x: Math.round(r.x), y: Math.round(r.y + window.scrollY), w: Math.round(r.width),
        visible: a.offsetParent !== null,
      };
    });
  }));
  console.log(`--- ${label} (${anchors.length} anchors) ---`);
  for (const a of anchors) console.log(JSON.stringify(a));
}

// 2. Scrollbar CSS values from the source's stylesheets.
console.log('=== 2. SOURCE SCROLLBAR RULES ===');
const sb = await withPage(SRC, '/', async (page) => page.evaluate(() => {
  const found = [];
  for (const sheet of document.styleSheets) {
    let rules; try { rules = sheet.cssRules; } catch { continue; }
    const walk = (rs) => {
      for (const rule of rs) {
        const sel = rule.selectorText || '';
        if (sel.includes('scrollbar')) found.push(rule.cssText.slice(0, 200));
        if (rule.cssRules) walk(rule.cssRules);
      }
    };
    walk(rules);
  }
  return found;
}));
for (const f of sb) console.log(f);

// 3. Legal label case + geometry.
console.log('=== 3. LEGAL LABEL ===');
for (const [origin, label] of [[SRC, 'src'], [CLONE, 'clone']]) {
  const legal = await withPage(origin, '/privacy', async (page) => page.evaluate(() => {
    // find the small label above the h1
    const h1 = document.querySelector('h1');
    if (!h1) return { h1: 'ABSENT' };
    const prev = h1.previousElementSibling;
    const parentKids = [...(h1.parentElement?.children || [])].map(c => ({
      tag: c.tagName, text: (c.textContent || '').replace(/\s+/g, ' ').trim().slice(0, 30),
      cls: (c.getAttribute('class') || '').slice(0, 60),
      cs: c.tagName === 'H1' ? null : {
        textTransform: getComputedStyle(c).textTransform,
        fontSize: getComputedStyle(c).fontSize,
        letterSpacing: getComputedStyle(c).letterSpacing,
      },
    }));
    return parentKids;
  }));
  console.log(`--- ${label} ---`);
  for (const k of legal) console.log(JSON.stringify(k));
}

// 4. Contact inputs inventory.
console.log('=== 4. CONTACT INPUTS ===');
for (const [origin, label] of [[SRC, 'src'], [CLONE, 'clone']]) {
  const inputs = await withPage(origin, '/contact', async (page) => page.evaluate(() => {
    return [...document.querySelectorAll('input, textarea, select')].map(i => ({
      tag: i.tagName.toLowerCase(), type: i.getAttribute('type'), name: i.getAttribute('name'),
      id: i.id, visible: i.offsetParent !== null,
      autoComplete: i.getAttribute('autocomplete'),
      tabIndex: i.getAttribute('tabindex'),
    }));
  }));
  console.log(`--- ${label} (${inputs.length}) ---`);
  for (const i of inputs) console.log(JSON.stringify(i));
}

await browser.close();

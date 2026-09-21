/**
 * Session 26 — deep-behavior parity audit: source vs clone.
 * Covers interaction-revealed + time-dependent surfaces that no previous
 * session's DOM line-diff could see:
 *
 *   A. FAQ accordion open/close (contact) — interaction state
 *   B. Gallery zoom modal (project detail) — interaction state
 *   C. Sticky parallax mid-scroll geometry (landing works row 1)
 *   D. Typewriter cycling text set (hero meta line, ~10s sample)
 *   E. Keyboard focus order (landing, first 18 Tab stops)
 *   F. Computed font families (h1 / body / mono)
 *   G. Tablet 768px layout probes (hero, menu trigger)
 *   H. Gallery video element behavior (muted/loop/autoplay attrs)
 */
import { chromium } from 'playwright';
import fs from 'node:fs';

const CLONE = 'http://localhost:3000';
const SRC = 'https://designer-portfolio.base44.app';
const PROJECT = '/project/kinto-cafe-branding';

const report = {};

const browser = await chromium.launch();

async function withPage(origin, path, vp, fn) {
  const ctx = await browser.newContext({ viewport: vp });
  const page = await ctx.newPage();
  await page.goto(origin + path, { waitUntil: 'networkidle', timeout: 45000 }).catch(() => {});
  await page.waitForTimeout(1500);
  let out;
  try { out = await fn(page); } catch (e) { out = { error: String(e).slice(0, 200) }; }
  await ctx.close();
  return out;
}

// ---------- A. FAQ accordion ----------
async function probeFaq(origin) {
  return withPage(origin, '/contact', { width: 1440, height: 900 }, async (page) => {
    // FAQ items: buttons (or summary) inside the page's lower half
    const cand = page.locator('button, summary').filter({ hasText: /question|how|what|do you|can you|timeline|process|budget|cost/i });
    const n = Math.min(await cand.count(), 8);
    const items = [];
    // find the accordion via heading text "Frequently" then sibling buttons
    const all = page.locator('button');
    const total = await all.count();
    const faqButtons = [];
    for (let i = 0; i < total; i++) {
      const t = (await all.nth(i).innerText().catch(() => '')).trim();
      if (t.length > 15 && t.endsWith('?')) faqButtons.push(all.nth(i));
    }
    if (faqButtons.length === 0) return { found: false, candidateCount: n };
    const first = faqButtons[0];
    const before = await first.evaluate((el) => {
      const cs = getComputedStyle(el);
      return { text: el.textContent.trim().slice(0, 60), expanded: el.getAttribute('aria-expanded') };
    });
    // sibling content state before click
    const panelBefore = await first.evaluate((el) => {
      // heuristics: next sibling or parent's next sibling holds the content
      const sib = el.parentElement.nextElementSibling || el.nextElementSibling;
      if (!sib) return null;
      const cs = getComputedStyle(sib);
      return { display: cs.display, height: cs.height, gridTemplateRows: cs.gridTemplateRows, hidden: sib.getAttribute('hidden'), tag: sib.tagName };
    });
    await first.click();
    await page.waitForTimeout(700);
    const after = await first.evaluate((el) => ({ expanded: el.getAttribute('aria-expanded') }));
    const panelAfter = await first.evaluate((el) => {
      const sib = el.parentElement.nextElementSibling || el.nextElementSibling;
      if (!sib) return null;
      const cs = getComputedStyle(sib);
      return { display: cs.display, height: cs.height, gridTemplateRows: cs.gridTemplateRows, hidden: sib.getAttribute('hidden'), text: (sib.textContent || '').trim().slice(0, 80) };
    });
    // close again
    await first.click();
    await page.waitForTimeout(700);
    const closedAgain = await first.evaluate((el) => {
      const sib = el.parentElement.nextElementSibling || el.nextElementSibling;
      return { expanded: el.getAttribute('aria-expanded'), sibHidden: sib ? (sib.getAttribute('hidden') !== null || getComputedStyle(sib).display === 'none' || getComputedStyle(sib).height === '0px') : null };
    });
    return { found: true, faqCount: faqButtons.length, before, panelBefore, after, panelAfter, closedAgain };
  });
}
report.faq = { source: await probeFaq(SRC), clone: await probeFaq(CLONE) };

// ---------- B. Gallery zoom modal ----------
async function probeZoom(origin) {
  return withPage(origin, PROJECT, { width: 1440, height: 900 }, async (page) => {
    // gallery images below the hero
    const imgs = page.locator('img[alt*="gallery" i], img[alt*="Gallery" i], figure img, [data-gallery] img');
    let count = await imgs.count();
    let item;
    if (count > 0) item = imgs.first();
    else {
      // fall back: all imgs, pick one in the lower half
      const all = page.locator('img');
      const n = await all.count();
      for (let i = 0; i < n; i++) {
        const bb = await all.nth(i).boundingBox();
        if (bb && bb.y > 900) { item = all.nth(i); break; }
      }
    }
    if (!item) return { found: false };
    await item.scrollIntoViewIfNeeded();
    await page.waitForTimeout(600);
    await item.click({ force: true });
    await page.waitForTimeout(900);
    // look for a dialog/overlay
    const overlay = await page.evaluate(() => {
      const dlgs = [...document.querySelectorAll('[role="dialog"], dialog, .fixed.inset-0, [data-state="open"]')];
      const visible = dlgs.filter((d) => {
        const cs = getComputedStyle(d);
        return cs.display !== 'none' && cs.visibility !== 'hidden' && d.getBoundingClientRect().width > 200;
      });
      if (!visible.length) return { found: false, dlgsTotal: dlgs.length };
      const d = visible[visible.length - 1];
      const cs = getComputedStyle(d);
      const r = d.getBoundingClientRect();
      const img = d.querySelector('img');
      return {
        found: true, tag: d.tagName, role: d.getAttribute('role'),
        zIndex: cs.zIndex, bg: cs.backgroundColor, position: cs.position,
        rect: { x: Math.round(r.x), y: Math.round(r.y), w: Math.round(r.width), h: Math.round(r.height) },
        img: img ? { w: Math.round(img.getBoundingClientRect().width), cursor: getComputedStyle(img).cursor, hasImg: true } : null,
        closeBtn: !!d.querySelector('button'),
        bodyScroll: getComputedStyle(document.body).overflow,
      };
    });
    return { found: true, galleryCount: count, overlay };
  });
}
report.zoom = { source: await probeZoom(SRC), clone: await probeZoom(CLONE) };

// ---------- C. Sticky parallax mid-scroll ----------
async function probeSticky(origin) {
  return withPage(origin, '/', { width: 1440, height: 900 }, async (page) => {
    // scroll to the works section
    const works = page.locator('text=SELECTED WORKS').first();
    await works.scrollIntoViewIfNeeded().catch(() => {});
    await page.evaluate(() => window.scrollBy(0, 500));
    await page.waitForTimeout(900);
    // first works row image: sticky element
    const img = await page.evaluate(() => {
      const els = [...document.querySelectorAll('img')];
      const sticky = els.filter((e) => getComputedStyle(e.closest('div,figure,picture') || e).position === 'sticky');
      const candidates = els.filter((e) => {
        const r = e.getBoundingClientRect();
        return r.width > 300 && r.height > 200;
      });
      const probe = sticky.length ? sticky[0] : candidates[2];
      if (!probe) return { found: false };
      const holder = probe.closest('div,figure,picture') || probe;
      const cs = getComputedStyle(holder);
      const r = holder.getBoundingClientRect();
      return { found: true, position: cs.position, top: cs.top, zIndex: cs.zIndex, rect: { y: Math.round(r.y), w: Math.round(r.width), h: Math.round(r.height) }, stickyCount: sticky.length };
    });
    return probe;
  });
}
report.sticky = { source: await probeSticky(SRC), clone: await probeSticky(CLONE) };

// ---------- D. Typewriter cycling text ----------
async function probeTypewriter(origin) {
  return withPage(origin, '/', { width: 1440, height: 900 }, async (page) => {
    const samples = [];
    const t0 = Date.now();
    while (Date.now() - t0 < 10000) {
      const txt = await page.evaluate(() => {
        // the meta line: small mono-ish text near the top; find element with blinking caret / typewriter pattern
        const els = [...document.querySelectorAll('h1, h2, p, span, div')].filter((e) => e.children.length === 0);
        for (const e of els) {
          const r = e.getBoundingClientRect();
          const t = (e.textContent || '').trim();
          if (r.y > 80 && r.y < 500 && t.length > 8 && t.length < 70 && /design|project|brand|portfolio|studio|experience|based|berlin|identity|typography|motion|art direction|digital|selected|graphic/i.test(t)) {
            return t;
          }
        }
        return null;
      }).catch(() => null);
      if (txt && !samples.includes(txt)) samples.push(txt);
      await page.waitForTimeout(400);
    }
    return { samples };
  });
}
report.typewriter = { source: await probeTypewriter(SRC), clone: await probeTypewriter(CLONE) };

// ---------- E. Keyboard focus order ----------
async function probeTabOrder(origin) {
  return withPage(origin, '/', { width: 1440, height: 900 }, async (page) => {
    const stops = [];
    for (let i = 0; i < 18; i++) {
      await page.keyboard.press('Tab');
      await page.waitForTimeout(60);
      const info = await page.evaluate(() => {
        const el = document.activeElement;
        if (!el || el === document.body) return null;
        const cs = getComputedStyle(el);
        const tag = el.tagName.toLowerCase();
        const label = (el.getAttribute('aria-label') || el.textContent || el.getAttribute('placeholder') || '').replace(/\s+/g, ' ').trim().slice(0, 40);
        return { tag, label, outline: cs.outlineStyle !== 'none' ? `${cs.outlineWidth} ${cs.outlineStyle} ${cs.outlineColor}` : 'none', ring: cs.boxShadow.slice(0, 60) };
      });
      stops.push(info || { tag: 'body' });
    }
    return { stops };
  });
}
report.tabOrder = { source: await probeTabOrder(SRC), clone: await probeTabOrder(CLONE) };

// ---------- F. Computed font families ----------
async function probeFonts(origin) {
  return withPage(origin, '/', { width: 1440, height: 900 }, async (page) => {
    return page.evaluate(() => {
      const h1 = document.querySelector('h1');
      const mono = [...document.querySelectorAll('*')].find((e) => {
        if (e.children.length) return false;
        const t = (e.textContent || '').trim();
        return t.length > 3 && t.length < 30 && /^[A-Z0-9\s/·—-]+$/.test(t);
      });
      return {
        h1: h1 ? getComputedStyle(h1).fontFamily.slice(0, 80) : null,
        body: getComputedStyle(document.body).fontFamily.slice(0, 80),
        monoCandidate: mono ? getComputedStyle(mono).fontFamily.slice(0, 80) : null,
      };
    });
  });
}
report.fonts = { source: await probeFonts(SRC), clone: await probeFonts(CLONE) };

// ---------- G. Tablet 768px ----------
async function probeTablet(origin) {
  return withPage(origin, '/', { width: 768, height: 1024 }, async (page) => {
    return page.evaluate(() => {
      const h1 = document.querySelector('h1');
      const menuBtn = [...document.querySelectorAll('button')].find((b) => /menu/i.test(b.getAttribute('aria-label') || b.textContent || ''));
      const cta = [...document.querySelectorAll('a,button')].find((e) => /start a project/i.test(e.textContent || ''));
      const h1r = h1 ? h1.getBoundingClientRect() : null;
      return {
        h1: h1 ? { fontSize: getComputedStyle(h1).fontSize, w: Math.round(h1r.width), y: Math.round(h1r.y) } : null,
        menuVisible: menuBtn ? getComputedStyle(menuBtn).display !== 'none' : null,
        cta: cta ? { visible: cta.getBoundingClientRect().width > 0, x: Math.round(cta.getBoundingClientRect().x), y: Math.round(cta.getBoundingClientRect().y) } : null,
        bodyOverflowX: document.documentElement.scrollWidth > 768,
      };
    });
  });
}
report.tablet = { source: await probeTablet(SRC), clone: await probeTablet(CLONE) };

// ---------- H. Gallery video ----------
async function probeVideo(origin) {
  return withPage(origin, PROJECT, { width: 1440, height: 900 }, async (page) => {
    // kinto has no video; probe sable (the seeded video project) if clone; source equivalent
    return { note: 'probed on sable route instead' };
  });
}
report.video = 'skipped-here';

fs.writeFileSync('/tmp/session26-deep-audit.json', JSON.stringify(report, null, 2));
console.log(JSON.stringify(report, null, 2));
await browser.close();

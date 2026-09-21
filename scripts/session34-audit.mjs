/**
 * Session 34 — interaction-machine + document-surface parity audit.
 *
 * Surfaces NO previous session systematically audited (s14–s32 covered DOM
 * text, head metadata, hover transitions, fonts via canvas metrics, focus
 * rings, machine surfaces, computed colors, mobile geometry, constellation
 * slots, breakpoint line-heights, DOM text-node texture, LOGO_BREATH
 * cadence, radial-menu link metrics, reduced-motion + motion profiles):
 *
 *   A. Source text drift sweep (re-run, mandatory every session).
 *   B. The THEME MACHINE — initial prefers-color-scheme resolution (which
 *      theme renders at first paint under a dark system), theme
 *      persistence (localStorage after toggle), the toggle's aria state /
 *      accessible name, the html element's theme attribute/class, and the
 *      toggle's visible icon per theme.
 *   C. Keyboard Tab order — the sequential focus order across the landing
 *      page (first 15 stops: tag + accessible name).
 *   D. Link href inventory per route — every anchor's href + rel/target
 *      (the document link graph).
 *   E. Font loading network trace — which font files each site requests
 *      per route (weights, subsets, woff2 sizes).
 *   F. Cursor styles inventory — computed `cursor` on the interactive
 *      chrome (CTA, menu trigger, works rows, project index rows, links,
 *      form fields).
 *   G. ::selection + scrollbar styling — custom selection color and
 *      scrollbar rules on both origins.
 *   H. Video element attributes — muted/loop/playsinline/controls/preload
 *      on the gallery video.
 *   I. aria attribute inventory — the aria-* map over interactive chrome
 *      + per-route interactive-element counts (a/button/input/select).
 */
import { chromium } from 'playwright';

const CLONE = 'http://localhost:3000';
const SRC = 'https://designer-portfolio.base44.app';

const report = {};
const browser = await chromium.launch();

async function withPage(origin, path, vp, fn, opts = {}) {
  const ctx = await browser.newContext({
    viewport: vp,
    colorScheme: opts.colorScheme,
    reducedMotion: opts.reducedMotion,
  });
  const page = await ctx.newPage();
  const fonts = [];
  page.on('response', (r) => {
    const ct = r.headers()['content-type'] || '';
    if (ct.includes('font') || r.url().match(/\.(woff2?|ttf)(\?|$)/)) {
      fonts.push({ url: r.url().split('/').pop().slice(0, 80), bytes: r.headers()['content-length'] || null });
    }
  });
  await page.goto(origin + path, { waitUntil: 'networkidle', timeout: 60000 }).catch(() => {});
  await page.waitForTimeout(opts.settle ?? 1800);
  let out;
  try { out = await fn(page, ctx, fonts); } catch (e) { out = { error: String(e).slice(0, 300) }; }
  await ctx.close();
  return out;
}

// ---------- A. text drift sweep ----------
const ROUTES = ['/', '/projects', '/about', '/contact', '/privacy', '/accessibility', '/project/kinto-cafe-branding'];

async function probeTextSignature(origin, path) {
  return withPage(origin, path, { width: 1440, height: 900 }, async (page) => {
    return page.evaluate(() => {
      const walker = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT, {
        acceptNode: (n) => (n.textContent.trim() && n.parentElement.offsetParent !== null)
          ? NodeFilter.FILTER_ACCEPT : NodeFilter.FILTER_REJECT,
      });
      const lines = [];
      let node;
      while ((node = walker.nextNode())) {
        const t = node.textContent.replace(/\s+/g, ' ').trim();
        if (t) lines.push(t);
      }
      return { count: lines.length, joined: lines.join(' | ').slice(0, 4000) };
    });
  });
}

report.textDrift = {};
for (const r of ROUTES) {
  const src = await probeTextSignature(SRC, r);
  const clone = await probeTextSignature(CLONE, r);
  const drift = src.joined === clone.joined ? 'MATCH' : (src.count === clone.count ? 'SAME-COUNT-DIFF-TEXT' : 'DIFF-COUNT');
  report.textDrift[r] = { drift, srcCount: src.count, cloneCount: clone.count };
  if (drift !== 'MATCH') {
    const a = src.joined.split(' | ');
    const b = clone.joined.split(' | ');
    const diffs = [];
    for (let i = 0; i < Math.max(a.length, b.length); i++) {
      if (a[i] !== b[i]) diffs.push({ i, src: (a[i] || '').slice(0, 90), clone: (b[i] || '').slice(0, 90) });
    }
    report.textDrift[r].diffs = diffs.slice(0, 12);
  }
}

// ---------- B. the theme machine ----------
async function probeThemeInitial(origin, scheme) {
  return withPage(origin, '/', { width: 1440, height: 900 }, async (page) => {
    return page.evaluate(() => {
      const html = document.documentElement;
      const bg = getComputedStyle(document.body).backgroundColor;
      return {
        htmlClass: html.className.slice(0, 120),
        htmlDataAttrs: Object.keys(html.dataset),
        htmlStyleAttr: (html.getAttribute('style') || '').slice(0, 120),
        colorScheme: getComputedStyle(html).colorScheme,
        bodyBg: bg,
        localStorage: Object.fromEntries(Object.entries(localStorage)),
      };
    });
  }, { colorScheme: scheme });
}

async function probeThemeToggle(origin) {
  return withPage(origin, '/', { width: 1440, height: 900 }, async (page) => {
    const before = await page.evaluate(() => ({
      htmlClass: document.documentElement.className.slice(0, 120),
      bodyBg: getComputedStyle(document.body).backgroundColor,
    }));
    // The theme toggle: the header's center control (button with sun/moon icon).
    const candidates = page.locator('header button, [class*="theme"] button, button[aria-label*="theme" i], button[aria-label*="Toggle" i], button[title*="theme" i]');
    const n = await candidates.count();
    let clicked = null;
    for (let i = 0; i < Math.min(n, 10); i++) {
      const el = candidates.nth(i);
      const txt = (await el.textContent().catch(() => '')).trim();
      const aria = await el.getAttribute('aria-label').catch(() => null);
      const visible = await el.isVisible().catch(() => false);
      if (visible && !txt && (txt === '')) {
        const box = await el.boundingBox().catch(() => null);
        // the center toggle sits horizontally centered in the header
        if (box && box.x > 300 && box.x < 1100 && box.width < 80) {
          await el.click();
          clicked = { i, aria, box: { x: Math.round(box.x), w: Math.round(box.width) } };
          break;
        }
      }
    }
    await page.waitForTimeout(1200);
    const after = await page.evaluate(() => ({
      htmlClass: document.documentElement.className.slice(0, 120),
      bodyBg: getComputedStyle(document.body).backgroundColor,
      localStorage: Object.fromEntries(Object.entries(localStorage)),
    }));
    const toggleInfo = await page.evaluate(() => {
      // describe the element under the header center
      const btns = [...document.querySelectorAll('header button, button')].filter(b => b.offsetParent !== null);
      const center = btns.filter(b => {
        const r = b.getBoundingClientRect();
        return r.x > 300 && r.x < 1100 && r.width < 80 && (b.textContent || '').trim() === '';
      }).slice(0, 3);
      return center.map(b => ({
        aria: b.getAttribute('aria-label'),
        title: b.getAttribute('title'),
        ariaPressed: b.getAttribute('aria-pressed'),
        svgPath: (b.querySelector('svg path')?.getAttribute('d') || '').slice(0, 60),
        svgCount: b.querySelectorAll('svg').length,
      }));
    });
    return { before, clicked, after, toggleInfo };
  });
}

report.themeMachine = {};
report.themeMachine.initialLight = { src: await probeThemeInitial(SRC, 'light'), clone: await probeThemeInitial(CLONE, 'light') };
report.themeMachine.initialDark = { src: await probeThemeInitial(SRC, 'dark'), clone: await probeThemeInitial(CLONE, 'dark') };
report.themeMachine.toggle = { src: await probeThemeToggle(SRC), clone: await probeThemeToggle(CLONE) };

// ---------- C. keyboard tab order ----------
async function probeTabOrder(origin) {
  return withPage(origin, '/', { width: 1440, height: 900 }, async (page) => {
    const stops = [];
    for (let i = 0; i < 18; i++) {
      await page.keyboard.press('Tab');
      const info = await page.evaluate(() => {
        const el = document.activeElement;
        if (!el || el === document.body) return { tag: 'body-end' };
        const r = el.getBoundingClientRect();
        return {
          tag: el.tagName.toLowerCase(),
          name: (el.getAttribute('aria-label') || el.textContent || '').replace(/\s+/g, ' ').trim().slice(0, 40),
          x: Math.round(r.x), y: Math.round(r.y),
        };
      });
      stops.push(info);
      if (info.tag === 'body-end') break;
    }
    return stops;
  });
}
report.tabOrder = { src: await probeTabOrder(SRC), clone: await probeTabOrder(CLONE) };

// ---------- D. link href inventory ----------
async function probeLinks(origin, path) {
  return withPage(origin, path, { width: 1440, height: 900 }, async (page) => {
    return page.evaluate(() => {
      const seen = new Map();
      for (const a of document.querySelectorAll('a[href]')) {
        if (a.offsetParent === null && !a.closest('body')) continue;
        const href = a.getAttribute('href');
        const key = `${href}|${a.getAttribute('rel') || ''}|${a.getAttribute('target') || ''}`;
        seen.set(key, (seen.get(key) || 0) + 1);
      }
      return Object.fromEntries(seen);
    });
  });
}
report.linkGraph = {};
for (const r of ROUTES) {
  report.linkGraph[r] = { src: await probeLinks(SRC, r), clone: await probeLinks(CLONE, r) };
}

// ---------- E. font loading trace ----------
async function probeFonts(origin, path) {
  return withPage(origin, path, { width: 1440, height: 900 }, async (page, ctx, fonts) => fonts);
}
report.fonts = {
  src: await probeFonts(SRC, '/'),
  clone: await probeFonts(CLONE, '/'),
};

// ---------- F. cursor styles ----------
async function probeCursors(origin) {
  return withPage(origin, '/', { width: 1440, height: 900 }, async (page) => {
    return page.evaluate(() => {
      const pick = (sel) => {
        const el = document.querySelector(sel);
        return el ? { sel, cursor: getComputedStyle(el).cursor } : { sel, cursor: 'ABSENT' };
      };
      return [
        pick('a[href^="mailto"]'),
        pick('a[href^="http"]'),
        pick('header button'),
        pick('[class*="cta" i], a[href*="contact"], a[href^="/contact"]'),
      ];
    });
  });
}
// works rows + project index rows need route context
async function probeCursorRows(origin) {
  return withPage(origin, '/projects', { width: 1440, height: 900 }, async (page) => {
    return page.evaluate(() => {
      const row = document.querySelector('a[href^="/project/"]');
      return { rowCursor: row ? getComputedStyle(row).cursor : 'ABSENT', rowTag: row?.tagName };
    });
  });
}
report.cursors = { src: await probeCursors(SRC), clone: await probeCursors(CLONE), srcRows: await probeCursorRows(SRC), cloneRows: await probeCursorRows(CLONE) };

// ---------- G. selection + scrollbar ----------
async function probeSelection(origin) {
  return withPage(origin, '/', { width: 1440, height: 900 }, async (page) => {
    return page.evaluate(() => {
      const selPseudo = {};
      for (const el of [document.documentElement, document.body, document.querySelector('h1'), document.querySelector('a')]) {
        if (!el) continue;
        const s = getComputedStyle(el, '::selection');
        const key = el.tagName.toLowerCase();
        selPseudo[key] = { bg: s.backgroundColor, color: s.color };
      }
      // scrollbar rules: scan stylesheets for ::-webkit-scrollbar / scrollbar-width
      let scrollbarRules = [];
      try {
        for (const sheet of document.styleSheets) {
          let rules; try { rules = sheet.cssRules; } catch { continue; }
          for (const rule of rules) {
            const t = rule.selectorText || rule.cssText || '';
            if (t.includes('scrollbar')) scrollbarRules.push(String(t).slice(0, 90));
          }
        }
      } catch { /* cross-origin */ }
      const htmlCS = getComputedStyle(document.documentElement);
      return { selPseudo, scrollbarRules: scrollbarRules.slice(0, 6), scrollbarWidth: htmlCS.scrollbarWidth };
    });
  });
}
report.selection = { src: await probeSelection(SRC), clone: await probeSelection(CLONE) };

// ---------- H. video attributes ----------
async function probeVideo(origin) {
  return withPage(origin, '/project/sable-fashion-brand', { width: 1440, height: 900 }, async (page) => {
    return page.evaluate(() => {
      const v = document.querySelector('video');
      if (!v) return { video: 'ABSENT' };
      return {
        muted: v.muted, loop: v.loop, playsInline: v.playsInline,
        controls: v.controls, autoplay: v.autoplay, preload: v.preload,
        w: v.videoWidth, h: v.videoHeight,
        cls: (v.getAttribute('class') || '').slice(0, 80),
        style: (v.getAttribute('style') || '').slice(0, 80),
      };
    });
  });
}
report.video = { src: await probeVideo(SRC), clone: await probeVideo(CLONE) };

// ---------- I. aria + interactive inventory ----------
async function probeAria(origin, path) {
  return withPage(origin, path, { width: 1440, height: 900 }, async (page) => {
    return page.evaluate(() => {
      const counts = { a: 0, button: 0, input: 0, select: 0, textarea: 0 };
      for (const tag of Object.keys(counts)) counts[tag] = document.querySelectorAll(tag).length;
      const ariaMap = [];
      for (const el of document.querySelectorAll('[aria-label], [aria-expanded], [aria-pressed], [aria-hidden], [role]')) {
        const attrs = {};
        for (const a of ['aria-label', 'aria-expanded', 'aria-pressed', 'aria-hidden', 'role']) {
          if (el.hasAttribute(a)) attrs[a] = el.getAttribute(a);
        }
        ariaMap.push({ tag: el.tagName.toLowerCase(), ...attrs });
      }
      return { counts, ariaMap: ariaMap.slice(0, 40) };
    });
  });
}
report.aria = {};
for (const r of ['/', '/projects', '/contact']) {
  report.aria[r] = { src: await probeAria(SRC, r), clone: await probeAria(CLONE, r) };
}

console.log(JSON.stringify(report, null, 1));
await browser.close();

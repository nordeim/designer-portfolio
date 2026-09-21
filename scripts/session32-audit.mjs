/**
 * Session 32 — reduced-motion + semantics + motion-profile parity audit.
 *
 * Surfaces NO previous session systematically audited (s14–s30 covered DOM
 * text, head metadata, interaction states, hover transitions, fonts, focus
 * rings, machine surfaces, computed colors, mobile geometry, constellation
 * slots, breakpoint line-heights, DOM text-node texture, LOGO_BREATH
 * cadence, radial-menu link metrics):
 *
 *   A. Source text drift sweep (re-run, mandatory every session).
 *   B. prefers-reduced-motion behavior — what the source actually does
 *      under emulated `reduce` (marquee anim, logo breath, typewriter,
 *      constellation cycling, hover transitions) vs our clone.
 *   C. Semantic heading hierarchy per route (h1..h6 level sequence,
 *      landmark elements main/nav/footer, list semantics).
 *   D. Radial-menu open/close ANIMATION profile — duration, easing,
 *      rotation settling (geometry was s30; the motion was not).
 *   E. Cursor-following preview motion profile on /projects — lag and
 *      interpolation between cursor position and preview position.
 *   F. Constellation cycling timers — show/gap duration distribution
 *      over a 30s sample window on both origins.
 *   G. Typewriter cadence — the meta line's per-character timing.
 *   H. Text-link hover states across surfaces (underline, color,
 *      transition) — computed :hover styles.
 */
import { chromium } from 'playwright';

const CLONE = 'http://localhost:3000';
const SRC = 'https://designer-portfolio.base44.app';

const report = {};
const browser = await chromium.launch();

async function withPage(origin, path, vp, fn, opts = {}) {
  const ctx = await browser.newContext({
    viewport: vp,
    reducedMotion: opts.reducedMotion,
    colorScheme: opts.colorScheme,
  });
  const page = await ctx.newPage();
  await page.goto(origin + path, { waitUntil: 'networkidle', timeout: 60000 }).catch(() => {});
  await page.waitForTimeout(opts.settle ?? 1800);
  let out;
  try { out = await fn(page, ctx); } catch (e) { out = { error: String(e).slice(0, 300) }; }
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

// ---------- B. reduced-motion behavior ----------
async function probeReducedMotion(origin) {
  return withPage(origin, '/', { width: 1440, height: 900 }, async (page) => {
    return page.evaluate(() => {
      const anims = [];
      // Marquee band
      const marquee = document.querySelector('[class*="marquee"], [class*="Marquee"]');
      if (marquee) {
        const track = marquee.querySelector('[class*="track"], [class*="animate"]') || marquee.firstElementChild || marquee;
        const cs = getComputedStyle(track);
        anims.push({ surface: 'marqueeTrack', animationName: cs.animationName, duration: cs.animationDuration, playState: cs.animationPlayState });
      }
      // All elements with running animations
      const runningAnims = [];
      for (const el of document.querySelectorAll('body *')) {
        const cs = getComputedStyle(el);
        if (cs.animationName !== 'none' && cs.animationPlayState !== 'paused') {
          runningAnims.push({ cls: (el.className || '').toString().slice(0, 60), name: cs.animationName, dur: cs.animationDuration });
        }
      }
      // Transitions configured
      let transitionCount = 0;
      for (const el of document.querySelectorAll('a, button, img, [class*="transition"]')) {
        const cs = getComputedStyle(el);
        if (cs.transitionProperty && cs.transitionProperty !== 'none' && cs.transitionDuration !== '0s') transitionCount++;
      }
      return { marquee: anims[0] || null, runningAnimationCount: runningAnims.length, runningAnims: runningAnims.slice(0, 8), transitionConfiguredCount: transitionCount };
    });
  }, { reducedMotion: 'reduce', settle: 2500 });
}

// ---------- C. semantic heading hierarchy ----------
async function probeSemantics(origin, path) {
  return withPage(origin, path, { width: 1440, height: 900 }, async (page) => {
    return page.evaluate(() => {
      const headings = [...document.querySelectorAll('h1,h2,h3,h4,h5,h6')].map((h) => ({
        level: parseInt(h.tagName[1], 10),
        text: h.textContent.replace(/\s+/g, ' ').trim().slice(0, 40),
      }));
      const landmarks = {};
      for (const tag of ['main', 'nav', 'footer', 'header', 'aside', 'form', 'section', 'article', 'ul', 'ol']) {
        landmarks[tag] = document.getElementsByTagName(tag).length;
      }
      return { headings, landmarks };
    });
  });
}

// ---------- D. radial-menu open animation profile ----------
async function probeMenuOpenAnim(origin) {
  const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 } });
  const page = await ctx.newPage();
  await page.goto(origin + '/', { waitUntil: 'networkidle', timeout: 60000 }).catch(() => {});
  await page.waitForTimeout(2000);
  // Click the menu trigger (pick the VISIBLE one — a mobile-only twin exists)
  const trigger = page.locator('button:has-text("Menu"), [aria-label*="menu" i]').filter({ hasText: /.+/ }).last();
  await trigger.waitFor({ state: 'visible', timeout: 10000 }).catch(() => {});
  const visible = await page.evaluate(() => {
    const btns = [...document.querySelectorAll('button')].filter((b) => (b.textContent || '').trim().toLowerCase() === 'menu');
    const vis = btns.find((b) => b.offsetParent !== null);
    if (vis) { vis.click(); return 'clicked-in-page'; }
    return 'not-found';
  });
  if (visible === 'not-found') { await trigger.click({ timeout: 5000 }).catch(() => {}); }
  // Sample the overlay transform/opacity over time
  const samples = [];
  for (let t = 0; t <= 1200; t += 60) {
    const s = await page.evaluate(() => {
      // the fixed inset-0 overlay that just appeared
      const overlays = [...document.querySelectorAll('div')].filter((d) => {
        const cs = getComputedStyle(d);
        return (cs.position === 'fixed') && (parseInt(cs.zIndex || '0', 10) >= 40) && d.offsetWidth > innerWidth * 0.9;
      });
      const ov = overlays[0];
      if (!ov) return null;
      const cs = getComputedStyle(ov);
      const first = ov.querySelector('a, nav, [class*="item"], li');
      const fcs = first ? getComputedStyle(first) : null;
      return {
        opacity: cs.opacity,
        transform: cs.transform !== 'none' ? cs.transform.slice(0, 50) : 'none',
        firstItemOpacity: fcs ? fcs.opacity : null,
        firstItemTransform: fcs && fcs.transform !== 'none' ? fcs.transform.slice(0, 50) : 'none',
      };
    }).catch(() => null);
    if (s) samples.push({ t, ...s });
    await page.waitForTimeout(60);
  }
  await ctx.close();
  return { samples: samples.filter((s, i) => i % 2 === 0 || i < 6) };
}

// ---------- E. cursor-preview motion profile (/projects) ----------
async function probeCursorPreview(origin) {
  const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 } });
  const page = await ctx.newPage();
  await page.goto(origin + '/projects', { waitUntil: 'networkidle', timeout: 60000 }).catch(() => {});
  await page.waitForTimeout(2000);
  // Hover a row, then move the mouse in a jump and sample preview position lag
  const row = page.locator('a[href*="/project/"]').first();
  await row.hover();
  await page.waitForTimeout(600);
  const samples = [];
  // Move to a fixed point, sample the preview box position
  await page.mouse.move(700, 400);
  for (let i = 0; i < 8; i++) {
    const s = await page.evaluate(() => {
      // find the floating preview: fixed/absolute positioned img container near cursor
      const cands = [...document.querySelectorAll('div, img')].filter((d) => {
        const cs = getComputedStyle(d);
        const r = d.getBoundingClientRect();
        return (cs.position === 'fixed' || cs.position === 'absolute') && r.width > 80 && r.height > 60 && parseInt(cs.zIndex || '0', 10) > 10;
      });
      if (!cands.length) return null;
      const r = cands[0].getBoundingClientRect();
      return { x: Math.round(r.x), y: Math.round(r.y), w: Math.round(r.width), h: Math.round(r.height) };
    }).catch(() => null);
    if (s) samples.push(s);
    await page.waitForTimeout(80);
  }
  await ctx.close();
  return { cursor: { x: 700, y: 400 }, samples };
}

// ---------- F. constellation cycling timers ----------
async function probeConstellationCycle(origin) {
  return withPage(origin, '/', { width: 1440, height: 900 }, async (page) => {
    const transitions = await page.evaluate(async () => {
      const imgEls = [...document.querySelectorAll('img')].filter((i) => {
        const r = i.getBoundingClientRect();
        const hero = document.querySelector('h1');
        return hero && r.top < 800 && r.width > 60 && r.height > 60 && i.src.includes('/projects/');
      });
      // sample visibility of each slot over 25s @ 250ms
      const N = 100, DT = 250;
      const samples = [];
      for (let k = 0; k < N; k++) {
        const state = imgEls.map((i) => {
          const cs = getComputedStyle(i);
          return cs.opacity !== '0' && cs.display !== 'none' && cs.visibility !== 'hidden' ? 1 : 0;
        });
        samples.push(state.join(''));
        await new Promise((r) => setTimeout(r, DT));
      }
      // derive show/gap runs per slot
      const runs = [];
      for (let slot = 0; slot < Math.min(imgEls.length, 10); slot++) {
        let show = [], gap = [];
        let cur = samples[0][slot] === '1', start = 0;
        for (let k = 1; k < N; k++) {
          const v = samples[k][slot] === '1';
          if (v !== cur) {
            const dur = (k - start) * DT;
            (cur ? show : gap).push(dur);
            cur = v; start = k;
          }
        }
        runs.push({ slot, showCount: show.length, showRange: show.length ? [Math.min(...show), Math.max(...show)] : null, gapRange: gap.length ? [Math.min(...gap), Math.max(...gap)] : null });
      }
      return { slotCount: imgEls.length, runs: runs.slice(0, 6) };
    }, undefined).catch((e) => ({ error: String(e).slice(0, 200) }));
    return transitions;
  }, { settle: 2000 });
}

// ---------- G. typewriter cadence ----------
async function probeTypewriter(origin) {
  return withPage(origin, '/', { width: 1440, height: 900 }, async (page) => {
    return page.evaluate(async () => {
      // the meta line under the hero h1 (contains GRAPHIC DESIGNER etc.)
      const meta = [...document.querySelectorAll('p, span, div')].find((e) => /GRAPHIC DESIGNER|BASED:/i.test(e.textContent) && e.textContent.length < 60 && e.closest('section, h1, header, body'));
      if (!meta) return { error: 'meta not found' };
      const textAt = [];
      for (let k = 0; k < 120; k++) {
        textAt.push(meta.textContent);
        await new Promise((r) => setTimeout(r, 100));
      }
      // find length deltas
      const lens = textAt.map((t) => t.replace(/\u200b/g, '').length);
      const deltas = [];
      for (let k = 1; k < lens.length; k++) {
        if (lens[k] !== lens[k - 1]) deltas.push({ t: k * 100, from: lens[k - 1], to: lens[k] });
      }
      // cluster deltas into typing bursts
      const bursts = [];
      let cur = null;
      for (const d of deltas) {
        if (cur && d.t - cur.last < 400) { cur.count++; cur.last = d.t; }
        else { cur = { start: d.t, last: d.t, count: 1 }; bursts.push(cur); }
      }
      return { sampledMs: 12000, changeEvents: deltas.length, bursts: bursts.length, burstDeltas: deltas.slice(0, 10).map((d) => d.to - d.from), firstText: textAt[0].slice(0, 40), lastText: textAt[textAt.length - 1].slice(0, 40) };
    });
  }, { settle: 1500 });
}

// ---------- H. text-link hover states ----------
async function probeLinkHover(origin, path) {
  const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 } });
  const page = await ctx.newPage();
  await page.goto(origin + path, { waitUntil: 'networkidle', timeout: 60000 }).catch(() => {});
  await page.waitForTimeout(2000);
  const linkSel = page.locator('a:has-text("All Projects"), a:has-text("Read My Story"), a:has-text("Start a Conversation"), footer a >> nth=0').first();
  const out = { resting: null, hovered: null };
  try {
    out.resting = await linkSel.evaluate((el) => {
      const cs = getComputedStyle(el);
      return { color: cs.color, textDecoration: cs.textDecorationLine, uOffset: cs.textDecorationThickness, transition: cs.transitionProperty + ' ' + cs.transitionDuration };
    });
    await linkSel.hover();
    await page.waitForTimeout(400);
    out.hovered = await linkSel.evaluate((el) => {
      const cs = getComputedStyle(el);
      return { color: cs.color, textDecoration: cs.textDecorationLine, uOffset: cs.textDecorationThickness, transition: cs.transitionProperty + ' ' + cs.transitionDuration };
    });
  } catch (e) { out.error = String(e).slice(0, 200); }
  await ctx.close();
  return out;
}

// ================= run =================
report.textDrift = {};
for (const path of ROUTES) {
  report.textDrift[path] = { src: await probeTextSignature(SRC, path), clone: await probeTextSignature(CLONE, path) };
}
report.reducedMotion = { src: await probeReducedMotion(SRC), clone: await probeReducedMotion(CLONE) };
report.semantics = {};
for (const path of ['/', '/projects', '/about', '/contact', '/project/kinto-cafe-branding']) {
  report.semantics[path] = { src: await probeSemantics(SRC, path), clone: await probeSemantics(CLONE, path) };
}
report.menuOpenAnim = { src: await probeMenuOpenAnim(SRC), clone: await probeMenuOpenAnim(CLONE) };
report.cursorPreview = { src: await probeCursorPreview(SRC), clone: await probeCursorPreview(CLONE) };
report.constellationCycle = { src: await probeConstellationCycle(SRC), clone: await probeConstellationCycle(CLONE) };
report.typewriter = { src: await probeTypewriter(SRC), clone: await probeTypewriter(CLONE) };
report.linkHover = { src: await probeLinkHover(SRC, '/'), clone: await probeLinkHover(CLONE, '/') };

console.log(JSON.stringify(report, null, 1));
await browser.close();

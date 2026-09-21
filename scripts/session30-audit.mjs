/**
 * Session 30 — scroll-geometry + motion-timing parity audit: source vs clone.
 *
 * Surfaces NO previous session audited (s16–s28 covered DOM text, head
 * metadata, interaction states, hover transitions, fonts, focus rings,
 * machine surfaces, computed colors, mobile geometry, constellation slots,
 * breakpoint line-heights):
 *
 *   A. Source text drift sweep — full visible-text signature per public
 *      route (landing, projects, about, contact, privacy, accessibility,
 *      one project detail) to detect ANY source content change since s28.
 *   B. Landing scroll-linked geometry — the works rows' sticky image
 *      behavior at 3 scroll positions (image top offset vs viewport,
 *      pinned vs free), the giant ghost numbering geometry, row heights.
 *   C. Philosophy section + footer marquee band geometry (statement
 *      metrics, band height, marquee font-size/tracking/animation).
 *   D. Motion timing — radial-menu open/close animation, breathing logo,
 *      marquee animation duration, FAQ accordion content transition,
 *      gallery zoom toggle, works-row reveal.
 *   E. Fixed chrome geometry — the "Start a Project" CTA bottom/right
 *      offsets + size; header logo box.
 *   F. Project detail prev/next link geometry + the detail page's
 *      full-bleed hero metrics.
 *   G. Performance surface (informational): paint timings per origin.
 *
 * Source login credentials are the operator-provided test account
 * (established repo convention in audit scripts).
 */
import { chromium } from 'playwright';

const CLONE = 'http://localhost:3000';
const SRC = 'https://designer-portfolio.base44.app';
const EMAIL = 'sepnetflix2023@outlook.com';
const PASSWORD = '$Abcd1234';

const report = {};
const browser = await chromium.launch();

async function withPage(origin, path, vp, fn, opts = {}) {
  const ctx = await browser.newContext({ viewport: vp });
  const page = await ctx.newPage();
  await page.goto(origin + path, { waitUntil: 'networkidle', timeout: 60000 }).catch(() => {});
  await page.waitForTimeout(opts.settle ?? 1800);
  let out;
  try { out = await fn(page); } catch (e) { out = { error: String(e).slice(0, 300) }; }
  await ctx.close();
  return out;
}

// ---------- A. source text drift sweep ----------
const ROUTES = ['/', '/projects', '/about', '/contact', '/privacy', '/accessibility', '/project/kinto-cafe-branding'];

async function probeTextSignature(origin, path) {
  return withPage(origin, path, { width: 1440, height: 900 }, async (page) => {
    return page.evaluate(() => {
      // All visible text nodes with their tag context, normalized.
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

// ---------- B. landing scroll-linked geometry ----------
async function probeWorksScroll(origin) {
  const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 } });
  const page = await ctx.newPage();
  await page.goto(origin + '/', { waitUntil: 'networkidle', timeout: 60000 }).catch(() => {});
  await page.waitForTimeout(2000);
  const out = await page.evaluate(() => {
    // The works section rows: a[href^="/project/"] blocks with big numbering.
    const rows = [...document.querySelectorAll('a[href^="/project/"]')].slice(0, 3);
    const rec = (el) => {
      const r = el.getBoundingClientRect();
      const cs = getComputedStyle(el);
      return { top: Math.round(r.top), h: Math.round(r.height), w: Math.round(r.width), pos: cs.position, sticky: cs.position === 'sticky' ? cs.top : null };
    };
    // giant ghost numbering: elements with huge font-size in the works area
    const ghosts = [...document.querySelectorAll('body *')].filter((el) => {
      const fs = parseFloat(getComputedStyle(el).fontSize);
      return fs >= 100 && el.textContent.trim().match(/^\d+\/\d+$/);
    }).slice(0, 3).map((el) => {
      const r = el.getBoundingClientRect();
      const cs = getComputedStyle(el);
      return { text: el.textContent.trim(), fs: cs.fontSize, top: Math.round(r.top), left: Math.round(r.left), color: cs.color, weight: cs.fontWeight, opacity: cs.opacity, pos: cs.position, zIndex: cs.zIndex };
    });
    return {
      rows: rows.map(rec),
      ghosts,
      scrollY: window.scrollY,
    };
  });
  // Now scroll to works section and re-sample.
  await page.evaluate(() => {
    const row = document.querySelector('a[href^="/project/"]');
    if (row) row.scrollIntoView({ block: 'center' });
  });
  await page.waitForTimeout(900);
  const mid = await page.evaluate(() => {
    const rows = [...document.querySelectorAll('a[href^="/project/"]')].slice(0, 3);
    const imgs = [...document.querySelectorAll('a[href^="/project/"] img')].slice(0, 3);
    const rec = (el) => {
      const r = el.getBoundingClientRect();
      const cs = getComputedStyle(el);
      return { top: Math.round(r.top), h: Math.round(r.height), pos: cs.position, stickyTop: cs.position === 'sticky' ? cs.top : null };
    };
    const imrec = (el) => {
      const r = el.getBoundingClientRect();
      return { top: Math.round(r.top), h: Math.round(r.height), w: Math.round(r.width) };
    };
    const ghosts = [...document.querySelectorAll('body *')].filter((el) => {
      const fs = parseFloat(getComputedStyle(el).fontSize);
      return fs >= 100 && el.textContent.trim().match(/^\d+\/\d+$/);
    }).slice(0, 3).map((el) => {
      const r = el.getBoundingClientRect();
      return { text: el.textContent.trim(), top: Math.round(r.top), fs: getComputedStyle(el).fontSize };
    });
    return { rows: rows.map(rec), imgs: imgs.map(imrec), ghosts, scrollY: Math.round(window.scrollY) };
  });
  // scroll further
  await page.evaluate(() => window.scrollBy(0, 600));
  await page.waitForTimeout(900);
  const deep = await page.evaluate(() => {
    const rows = [...document.querySelectorAll('a[href^="/project/"]')].slice(0, 3);
    const imgs = [...document.querySelectorAll('a[href^="/project/"] img')].slice(0, 3);
    const rec = (el) => {
      const r = el.getBoundingClientRect();
      return { top: Math.round(r.top), h: Math.round(r.height), pos: getComputedStyle(el).position };
    };
    const imrec = (el) => {
      const r = el.getBoundingClientRect();
      return { top: Math.round(r.top), h: Math.round(r.height), w: Math.round(r.width) };
    };
    return { rows: rows.map(rec), imgs: imgs.map(imrec), scrollY: Math.round(window.scrollY) };
  });
  await ctx.close();
  return { initial: out, mid, deep };
}

// ---------- C. philosophy + marquee geometry ----------
async function probePhilosophyMarquee(origin) {
  return withPage(origin, '/', { width: 1440, height: 900 }, async (page) => {
    return page.evaluate(() => {
      // marquee: element with animationDuration and huge font in footer
      const track = document.querySelector('.marquee-track, [class*="marquee"]');
      let marquee = null;
      if (track) {
        const r = track.getBoundingClientRect();
        const cs = getComputedStyle(track);
        marquee = { cls: track.className.slice?.(0, 80) ?? String(track.className).slice(0, 80), top: Math.round(r.top), h: Math.round(r.height), fs: cs.fontSize, ls: cs.letterSpacing, animName: cs.animationName, animDur: cs.animationDuration, animTiming: cs.animationTimingFunction, text: track.textContent.trim().slice(0, 60) };
      }
      // philosophy: the section between works and footer — h2 + paragraph cluster
      const h2s = [...document.querySelectorAll('h2')].map((el) => {
        const r = el.getBoundingClientRect();
        const cs = getComputedStyle(el);
        return { text: el.textContent.trim().slice(0, 50), top: Math.round(r.top), fs: cs.fontSize, lh: cs.lineHeight, fw: cs.fontWeight, ls: cs.letterSpacing };
      });
      // footer band
      const footer = document.querySelector('footer');
      let foot = null;
      if (footer) {
        const r = footer.getBoundingClientRect();
        foot = { top: Math.round(r.top), h: Math.round(r.height) };
      }
      return { marquee, h2s, footer: foot, docH: document.documentElement.scrollHeight };
    });
  }, { settle: 2500 });
}

// ---------- D. motion timing ----------
async function probeRadialMenu(origin) {
  const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 } });
  const page = await ctx.newPage();
  await page.goto(origin + '/', { waitUntil: 'networkidle', timeout: 60000 }).catch(() => {});
  await page.waitForTimeout(2000);
  const out = {};
  // find the menu open button
  const btn = page.getByRole('button', { name: /open menu|menu/i }).first();
  out.openBtn = await btn.evaluate((el) => {
    const r = el.getBoundingClientRect();
    const cs = getComputedStyle(el);
    return { aria: el.getAttribute('aria-label'), top: Math.round(r.top), left: Math.round(r.left), w: Math.round(r.width), h: Math.round(r.height) };
  }).catch((e) => ({ error: String(e).slice(0, 200) }));
  await btn.click().catch(() => {});
  await page.waitForTimeout(120);
  // sample the dialog during open animation
  const dlg = page.getByRole('dialog').first();
  out.openAnim = await dlg.evaluate((el) => {
    const cs = getComputedStyle(el);
    const inner = el.firstElementChild;
    const ics = inner ? getComputedStyle(inner) : null;
    return {
      transition: cs.transition?.slice(0, 200), animation: cs.animation?.slice(0, 200),
      innerTransition: ics?.transition?.slice(0, 200), innerAnimation: ics?.animation?.slice(0, 200),
      opacity: cs.opacity,
    };
  }).catch((e) => ({ error: String(e).slice(0, 200) }));
  await page.waitForTimeout(1800);
  out.openSettled = await dlg.evaluate((el) => {
    const r = el.getBoundingClientRect();
    const cs = getComputedStyle(el);
    // wheel items: links inside
    const links = [...el.querySelectorAll('a')].slice(0, 5).map((a) => {
      const ar = a.getBoundingClientRect();
      const acs = getComputedStyle(a);
      return { text: a.textContent.trim().slice(0, 20), x: Math.round(ar.x), y: Math.round(ar.y), fs: acs.fontSize, ls: acs.letterSpacing, transform: acs.transform.slice(0, 60) };
    });
    return { w: Math.round(r.width), h: Math.round(r.height), opacity: cs.opacity, links };
  }).catch((e) => ({ error: String(e).slice(0, 200) }));
  // close timing: click escape, sample opacity over time
  await page.keyboard.press('Escape');
  await page.waitForTimeout(80);
  out.closingOpacity = await dlg.evaluate((el) => getComputedStyle(el).opacity).catch(() => 'gone');
  await ctx.close();
  return out;
}

async function probeBreathingLogo(origin) {
  return withPage(origin, '/', { width: 1440, height: 900 }, async (page) => {
    return page.evaluate(() => {
      // the header logo: element in header with letter-spacing animation
      const header = document.querySelector('header') ?? document.querySelector('nav');
      if (!header) return { error: 'no header' };
      const cands = [...header.querySelectorAll('a, span, div, button')].filter((el) => {
        const cs = getComputedStyle(el);
        return cs.animationName !== 'none' && (parseFloat(cs.letterSpacing) > 0.2 || /breath|logo|anim/i.test(cs.animationName));
      });
      return cands.slice(0, 2).map((el) => {
        const cs = getComputedStyle(el);
        const r = el.getBoundingClientRect();
        return { text: el.textContent.trim().slice(0, 30), animName: cs.animationName, animDur: cs.animationDuration, animTiming: cs.animationTimingFunction, ls: cs.letterSpacing, fs: cs.fontSize, fw: cs.fontWeight, w: Math.round(r.width) };
      });
    });
  });
}

async function probeFaqTiming(origin) {
  const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 } });
  const page = await ctx.newPage();
  await page.goto(origin + '/contact', { waitUntil: 'networkidle', timeout: 60000 }).catch(() => {});
  await page.waitForTimeout(1800);
  const out = {};
  // Find accordion triggers
  const triggers = page.locator('button[aria-controls], [data-radix-collection-item], h3 button, button').filter({ hasText: /.+/ });
  // click the first FAQ-looking trigger
  const faqBtn = page.getByRole('button', { name: /how|what|do you|can you|long|much|start/i }).first();
  out.triggerInfo = await faqBtn.evaluate((el) => {
    const r = el.getBoundingClientRect();
    const cs = getComputedStyle(el);
    return { text: el.textContent.trim().slice(0, 60), w: Math.round(r.width), h: Math.round(r.height), fs: cs.fontSize, fw: cs.fontWeight, py: cs.paddingTop + '/' + cs.paddingBottom };
  }).catch((e) => ({ error: String(e).slice(0, 200) }));
  await faqBtn.click().catch(() => {});
  await page.waitForTimeout(80);
  out.duringOpen = await page.evaluate(() => {
    // find the expanding content: hidden="" removed or [data-state=open] sibling content
    const content = document.querySelector('[data-state="open"] + *, [role="region"][data-state="open"], .accordion-content, [data-radix-accordion-content]');
    if (!content) return { error: 'no content el' };
    const cs = getComputedStyle(content);
    const r = content.getBoundingClientRect();
    return { h: Math.round(r.height), transition: cs.transition?.slice(0, 200), animDur: cs.animationDuration, overflow: cs.overflow };
  });
  await page.waitForTimeout(1200);
  out.settled = await page.evaluate(() => {
    const content = document.querySelector('[role="region"][data-state="open"], .accordion-content, [data-radix-accordion-content], [data-state="open"] + *');
    if (!content) return { error: 'no content el' };
    const r = content.getBoundingClientRect();
    return { h: Math.round(r.height) };
  });
  await ctx.close();
  return out;
}

async function probeGalleryZoom(origin) {
  const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 } });
  const page = await ctx.newPage();
  await page.goto(origin + '/project/kinto-cafe-branding', { waitUntil: 'networkidle', timeout: 60000 }).catch(() => {});
  await page.waitForTimeout(2000);
  const out = {};
  // gallery grid + zoom button
  out.grid = await page.evaluate(() => {
    // gallery: grid of images after the intro; find a grid container with 2+ imgs
    const grids = [...document.querySelectorAll('div')].filter((el) => {
      const cs = getComputedStyle(el);
      return cs.display.includes('grid') && el.querySelectorAll('img').length >= 2 && el.getBoundingClientRect().height > 200;
    }).slice(0, 2);
    return grids.map((g) => {
      const cs = getComputedStyle(g);
      const r = g.getBoundingClientRect();
      return { cols: cs.gridTemplateColumns?.slice(0, 60), gap: cs.gap, w: Math.round(r.width), imgs: g.querySelectorAll('img').length };
    });
  });
  const zoomBtn = page.getByRole('button', { name: /zoom|expand|toggle|grid|column/i }).first();
  out.zoomBtn = await zoomBtn.evaluate((el) => {
    const r = el.getBoundingClientRect();
    return { aria: el.getAttribute('aria-label') ?? el.textContent.trim().slice(0, 30), w: Math.round(r.width), h: Math.round(r.height), top: Math.round(r.top) };
  }).catch((e) => ({ error: String(e).slice(0, 150) }));
  await zoomBtn.click().catch(() => {});
  await page.waitForTimeout(1000);
  out.afterToggle = await page.evaluate(() => {
    const grids = [...document.querySelectorAll('div')].filter((el) => {
      const cs = getComputedStyle(el);
      return cs.display.includes('grid') && el.querySelectorAll('img').length >= 2 && el.getBoundingClientRect().height > 200;
    }).slice(0, 2);
    return grids.map((g) => {
      const cs = getComputedStyle(g);
      const r = g.getBoundingClientRect();
      return { cols: cs.gridTemplateColumns?.slice(0, 60), gap: cs.gap, w: Math.round(r.width), imgs: g.querySelectorAll('img').length };
    });
  });
  await ctx.close();
  return out;
}

// ---------- E. fixed chrome geometry ----------
async function probeFixedChrome(origin) {
  return withPage(origin, '/', { width: 1440, height: 900 }, async (page) => {
    return page.evaluate(() => {
      // fixed CTA: anchor/button with "Start a Project"
      const cta = [...document.querySelectorAll('a, button')].find((el) => /start a project/i.test(el.textContent));
      let ctaRec = null;
      if (cta) {
        const r = cta.getBoundingClientRect();
        const cs = getComputedStyle(cta);
        ctaRec = { text: cta.textContent.trim().slice(0, 40), bottom: Math.round(window.innerHeight - r.bottom), right: Math.round(window.innerWidth - r.right), w: Math.round(r.width), h: Math.round(r.height), fs: cs.fontSize, fw: cs.fontWeight, pos: cs.position, bg: cs.backgroundColor, color: cs.color };
      }
      // header logo
      const header = document.querySelector('header, nav');
      let logoRec = null;
      if (header) {
        const hr = header.getBoundingClientRect();
        const hcs = getComputedStyle(header);
        logoRec = { h: Math.round(hr.height), pos: hcs.position, top: hcs.position === 'fixed' || hcs.position === 'sticky' ? hcs.top : null, z: hcs.zIndex, bg: hcs.backgroundColor };
      }
      return { cta: ctaRec, header: logoRec };
    });
  });
}

// ---------- F. project detail prev/next + hero ----------
async function probeDetailChrome(origin) {
  return withPage(origin, '/project/kinto-cafe-branding', { width: 1440, height: 900 }, async (page) => {
    return page.evaluate(() => {
      // hero h1 + labels
      const h1 = document.querySelector('h1');
      const h1r = h1 ? h1.getBoundingClientRect() : null;
      const h1cs = h1 ? getComputedStyle(h1) : null;
      // prev/next: links at the bottom
      const links = [...document.querySelectorAll('a')].filter((a) => /^(prev|next|←|→)/i.test(a.textContent.trim()) || /previous|next project/i.test(a.textContent));
      const pn = links.slice(0, 4).map((a) => {
        const r = a.getBoundingClientRect();
        const cs = getComputedStyle(a);
        return { text: a.textContent.trim().slice(0, 40), top: Math.round(r.top), w: Math.round(r.width), fs: cs.fontSize, fw: cs.fontWeight, ls: cs.letterSpacing, transform: cs.transform.slice(0, 40), href: (a.getAttribute('href') || '').slice(0, 50) };
      });
      // hero image
      const heroImg = document.querySelector('img');
      let hero = null;
      if (heroImg) {
        const r = heroImg.getBoundingClientRect();
        hero = { w: Math.round(r.width), h: Math.round(r.height), top: Math.round(r.top) };
      }
      return {
        h1: h1r && h1cs ? { fs: h1cs.fontSize, lh: h1cs.lineHeight, fw: h1cs.fontWeight, top: Math.round(h1r.top), w: Math.round(h1r.width) } : null,
        prevNext: pn,
        heroImg: hero,
      };
    });
  });
}

// ---------- G. performance surface ----------
async function probePerf(origin, path) {
  return withPage(origin, path, { width: 1440, height: 900 }, async (page) => {
    return page.evaluate(() => {
      const nav = performance.getEntriesByType('navigation')[0];
      const paint = performance.getEntriesByType('paint');
      return {
        ttfb: Math.round(nav?.responseStart ?? -1),
        domContentLoaded: Math.round(nav?.domContentLoadedEventEnd ?? -1),
        load: Math.round(nav?.loadEventEnd ?? -1),
        fcp: paint.find((p) => p.name === 'first-contentful-paint') ? Math.round(paint.find((p) => p.name === 'first-contentful-paint').startTime) : -1,
        transferKB: Math.round((nav?.transferSize ?? 0) / 1024),
      };
    });
  }, { settle: 2500 });
}

// ---------- run ----------
report.textDrift = {};
for (const path of ROUTES) {
  report.textDrift[path] = {
    src: await probeTextSignature(SRC, path),
    clone: await probeTextSignature(CLONE, path),
  };
}

report.worksScroll = { src: await probeWorksScroll(SRC), clone: await probeWorksScroll(CLONE) };
report.philosophyMarquee = { src: await probePhilosophyMarquee(SRC), clone: await probePhilosophyMarquee(CLONE) };
report.radialMenu = { src: await probeRadialMenu(SRC), clone: await probeRadialMenu(CLONE) };
report.breathingLogo = { src: await probeBreathingLogo(SRC), clone: await probeBreathingLogo(CLONE) };
report.faqTiming = { src: await probeFaqTiming(SRC), clone: await probeFaqTiming(CLONE) };
report.galleryZoom = { src: await probeGalleryZoom(SRC), clone: await probeGalleryZoom(CLONE) };
report.fixedChrome = { src: await probeFixedChrome(SRC), clone: await probeFixedChrome(CLONE) };
report.detailChrome = { src: await probeDetailChrome(SRC), clone: await probeDetailChrome(CLONE) };
report.perf = { src: await probePerf(SRC, '/'), clone: await probePerf(CLONE, '/') };

await browser.close();
console.log(JSON.stringify(report, null, 1));

/**
 * Session 28 — mobile-geometry / about / typewriter / constellation audit.
 *
 * Surfaces no prior session probed:
 *   A. Mobile 390px geometry: hero block, first works row, contact form,
 *      about portrait, project-detail hero — bounding boxes + font sizes.
 *   B. About page desktop geometry: portrait, timeline items, skills matrix.
 *   C. Typewriter timing: sample the hero meta line's text at 120ms
 *      resolution for ~12s — derive per-char type interval, hold, delete.
 *   D. Constellation geometry: image positions/sizes at 1440px (the
 *      floating hero image grid).
 */
import { chromium } from 'playwright';

const CLONE = 'http://localhost:3000';
const SRC = 'https://designer-portfolio.base44.app';

const report = {};
const browser = await chromium.launch();

async function withPage(origin, path, vp, fn) {
  const ctx = await browser.newContext({ viewport: vp });
  const page = await ctx.newPage();
  await page.goto(origin + path, { waitUntil: 'networkidle', timeout: 45000 }).catch(() => {});
  await page.waitForTimeout(1800);
  let out;
  try { out = await fn(page); } catch (e) { out = { error: String(e).slice(0, 300) }; }
  await ctx.close();
  return out;
}

// ---------- A. mobile 390px geometry ----------
async function probeMobile(origin, path) {
  return withPage(origin, path, { width: 390, height: 844 }, async (page) => {
    return page.evaluate(() => {
      const rect = (el) => {
        if (!el) return null;
        const r = el.getBoundingClientRect();
        const cs = getComputedStyle(el);
        return { x: Math.round(r.x), y: Math.round(r.y), w: Math.round(r.width), h: Math.round(r.height), fs: cs.fontSize, fw: cs.fontWeight, lh: cs.lineHeight };
      };
      const h1 = document.querySelector('h1');
      const imgs = Array.from(document.querySelectorAll('img')).slice(0, 6).map((i) => ({ alt: (i.alt || '').slice(0, 30), ...rect(i) }));
      const formInput = document.querySelector('input, textarea');
      return {
        h1: rect(h1),
        firstImgs: imgs,
        formInput: rect(formInput),
        bodyW: document.body.getBoundingClientRect().width,
        overflowX: document.documentElement.scrollWidth > document.documentElement.clientWidth,
        h1Text: h1 ? h1.textContent.trim().slice(0, 40) : null,
      };
    });
  });
}

// ---------- B. about page geometry ----------
async function probeAbout(origin) {
  return withPage(origin, '/about', { width: 1440, height: 900 }, async (page) => {
    return page.evaluate(() => {
      const rect = (el) => {
        if (!el) return null;
        const r = el.getBoundingClientRect();
        const cs = getComputedStyle(el);
        return { x: Math.round(r.x), y: Math.round(r.y), w: Math.round(r.width), h: Math.round(r.height), fs: cs.fontSize, fw: cs.fontWeight, lh: cs.lineHeight, ls: cs.letterSpacing };
      };
      const h1 = document.querySelector('h1');
      const h2s = Array.from(document.querySelectorAll('h2')).slice(0, 4).map(rect);
      // portrait = first large image
      const imgs = Array.from(document.querySelectorAll('img')).filter((i) => i.getBoundingClientRect().width > 200).slice(0, 3).map((i) => ({ alt: (i.alt || '').slice(0, 30), ...rect(i) }));
      // skills: dot-matrix rows — small elements in a grid
      const dots = Array.from(document.querySelectorAll('span, div')).filter((e) => {
        const r = e.getBoundingClientRect();
        return r.width >= 5 && r.width <= 12 && r.height >= 5 && r.height <= 12;
      }).slice(0, 40).map((e) => { const r = e.getBoundingClientRect(); return { x: Math.round(r.x), y: Math.round(r.y), w: Math.round(r.width), bg: getComputedStyle(e).backgroundColor }; });
      const yearish = Array.from(document.querySelectorAll('body *')).filter((e) => {
        const t = (e.textContent || '').trim();
        return /^\d{4}\s*[-–—]?\s*(\d{4}|present)?$/i.test(t) && e.children.length === 0;
      }).slice(0, 8).map((e) => { const r = e.getBoundingClientRect(); return { text: e.textContent.trim(), x: Math.round(r.x), y: Math.round(r.y), fs: getComputedStyle(e).fontSize }; });
      return { h1: rect(h1), h1Text: h1?.textContent.trim().slice(0, 40), h2s, imgs, dots, yearish };
    });
  });
}

// ---------- C. typewriter timing ----------
async function probeTypewriter(origin) {
  return withPage(origin, '/', { width: 1440, height: 900 }, async (page) => {
    return page.evaluate(() => new Promise((resolve) => {
      // find the meta line: small mono text near the h1 that contains a role word
      let el = null;
      for (const e of document.querySelectorAll('h1, p, span, div')) {
        const t = (e.textContent || '').trim();
        if (/graphic designer|brand designer|art director|based:? berlin/i.test(t) && t.length < 40 && e.children.length <= 1) { el = e; break; }
      }
      if (!el) { resolve({ found: false }); return; }
      const samples = [];
      const start = performance.now();
      const iv = setInterval(() => {
        const t = el.textContent;
        samples.push({ t: Math.round(performance.now() - start), len: t.length, text: t.slice(0, 50) });
        if (samples.length >= 100) {
          clearInterval(iv);
          // derive: per-char intervals while len grows
          const grows = [];
          let last = null;
          for (const s of samples) {
            if (last !== null && s.len === last.len + 1) grows.push(s.t - last.t);
            last = s;
          }
          const texts = [...new Set(samples.map((s) => s.text))];
          resolve({
            found: true,
            sampledMs: samples[samples.length - 1].t,
            distinctTexts: texts,
            growIntervals: grows.length ? { n: grows.length, median: grows.slice().sort((a, b) => a - b)[Math.floor(grows.length / 2)] } : null,
            lenSeries: samples.map((s) => s.len),
          });
        }
      }, 120);
    }));
  });
}

// ---------- D. constellation geometry ----------
async function probeConstellation(origin) {
  return withPage(origin, '/', { width: 1440, height: 900 }, async (page) => {
    return page.evaluate(() => {
      // the hero's floating images: images within the first viewport that are not works-row images
      const heroImgs = Array.from(document.querySelectorAll('img'))
        .filter((i) => {
          const r = i.getBoundingClientRect();
          return r.y > -50 && r.y < 700 && r.width > 60 && r.width < 400;
        })
        .slice(0, 8)
        .map((i) => {
          const r = i.getBoundingClientRect();
          return { alt: (i.alt || '').slice(0, 30), x: Math.round(r.x), y: Math.round(r.y), w: Math.round(r.width), h: Math.round(r.height) };
        });
      const h1 = document.querySelector('h1');
      return { heroImgs, h1x: h1 ? Math.round(h1.getBoundingClientRect().x) : null };
    });
  });
}

report.mobile = {
  landing_src: await probeMobile(SRC, '/'),
  landing_clone: await probeMobile(CLONE, '/'),
  contact_src: await probeMobile(SRC, '/contact'),
  contact_clone: await probeMobile(CLONE, '/contact'),
  detail_src: await probeMobile(SRC, '/project/kinto-cafe-branding'),
  detail_clone: await probeMobile(CLONE, '/project/kinto-cafe-branding'),
};

report.about = {
  src: await probeAbout(SRC),
  clone: await probeAbout(CLONE),
};

report.typewriter = {
  src: await probeTypewriter(SRC),
  clone: await probeTypewriter(CLONE),
};

report.constellation = {
  src: await probeConstellation(SRC),
  clone: await probeConstellation(CLONE),
};

await browser.close();
console.log(JSON.stringify(report, null, 1));

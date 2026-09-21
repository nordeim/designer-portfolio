/**
 * Session 28 — head-metadata + source-drift parity audit: source vs clone.
 *
 * Surfaces NO previous session audited (sessions 16–26 covered DOM text,
 * interaction states, scroll geometry, fonts, focus rings, machine surfaces):
 *
 *   A. <head> metadata inventory: title, meta description, og:*, twitter:*,
 *      viewport, canonical/alternate links, favicon/icon links, theme-color,
 *      charset, apple-touch meta — name+property+content, in document order.
 *   B. Source drift check: landing h1 + nav + meta-line text, contact form
 *      labels, project detail labels (first 40 lines of rendered text) to
 *      confirm the source has not drifted since session 26.
 *   C. Source login flow re-verification: where does a successful login land
 *      (the operator's prompt says a dashboard; sessions 18/26 measured a
 *      redirect to `/` — re-measure).
 *   D. Font-family computed stack on body + h1 + mono label (post-26 sanity).
 */
import { chromium } from 'playwright';

const CLONE = 'http://localhost:3000';
const SRC = 'https://designer-portfolio.base44.app';
const EMAIL = 'sepnetflix2023@outlook.com';
const PASSWORD = '$Abcd1234';

const report = {};
const browser = await chromium.launch();

async function withPage(origin, path, vp, fn) {
  const ctx = await browser.newContext({ viewport: vp });
  const page = await ctx.newPage();
  await page.goto(origin + path, { waitUntil: 'networkidle', timeout: 45000 }).catch(() => {});
  await page.waitForTimeout(1500);
  let out;
  try { out = await fn(page); } catch (e) { out = { error: String(e).slice(0, 300) }; }
  await ctx.close();
  return out;
}

// ---------- A. head metadata inventory ----------
async function probeHead(origin, path) {
  return withPage(origin, path, { width: 1440, height: 900 }, async (page) => {
    return page.evaluate(() => {
      const out = [];
      const head = document.head;
      for (const el of head.children) {
        const tag = el.tagName.toLowerCase();
        const rec = { tag };
        if (tag === 'title') { rec.text = el.textContent.trim(); }
        if (tag === 'meta') {
          rec.name = el.getAttribute('name');
          rec.property = el.getAttribute('property');
          rec.content = (el.getAttribute('content') || '').slice(0, 160);
          rec.httpEquiv = el.getAttribute('http-equiv');
        }
        if (tag === 'link') {
          rec.rel = el.getAttribute('rel');
          rec.href = (el.getAttribute('href') || '').slice(0, 160);
          rec.sizes = el.getAttribute('sizes');
          rec.type = el.getAttribute('type');
        }
        // skip empty script/style nodes and preload noise
        if (tag === 'script' || tag === 'style') continue;
        if (rec.name || rec.property || rec.content || rec.rel || rec.text || rec.httpEquiv) out.push(rec);
      }
      return { title: document.title, count: out.length, metas: out };
    });
  });
}

// ---------- B. source drift check ----------
async function probeText(origin, path) {
  return withPage(origin, path, { width: 1440, height: 900 }, async (page) => {
    return page.evaluate(() => {
      const txt = (sel) => {
        const el = document.querySelector(sel);
        return el ? el.textContent.trim().slice(0, 120) : null;
      };
      const h1 = document.querySelector('h1');
      const metas = Array.from(document.querySelectorAll('[class*="tracking"], [style*="letter-spacing"]'))
        .map((e) => e.textContent.trim()).filter((t) => t && t.length < 40).slice(0, 8);
      return {
        h1: h1 ? h1.textContent.trim().slice(0, 120) : null,
        buttons: Array.from(document.querySelectorAll('button')).map((b) => b.textContent.trim().slice(0, 40)).filter(Boolean).slice(0, 10),
        labelish: metas,
      };
    });
  });
}

// ---------- C. source login flow ----------
async function probeLogin() {
  const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 } });
  const page = await ctx.newPage();
  await page.goto(`${SRC}/login`, { waitUntil: 'networkidle', timeout: 45000 }).catch(() => {});
  await page.waitForTimeout(2000);
  const pre = page.url();
  // type credentials into password-type + email/text inputs
  const pw = page.locator('input[type="password"]').first();
  const em = page.locator('input[type="email"], input[type="text"]').first();
  const loginInfo = { pre, emailField: await em.count(), pwField: await pw.count() };
  try {
    await em.fill(EMAIL);
    await pw.fill(PASSWORD);
    // find the submit button (type=submit or button with sign-in copy)
    const submit = page.locator('button[type="submit"], button:has-text("Sign"), button:has-text("Log"), button:has-text("log")').first();
    await Promise.all([
      page.waitForNavigation({ timeout: 20000 }).catch(() => {}),
      submit.click(),
    ]);
    await page.waitForTimeout(4000);
    loginInfo.post = page.url();
    loginInfo.postH1 = await page.locator('h1').first().textContent().catch(() => null);
    loginInfo.postText = (await page.locator('body').innerText().catch(() => '')).slice(0, 400);
  } catch (e) {
    loginInfo.error = String(e).slice(0, 300);
  }
  await ctx.close();
  return loginInfo;
}

// ---------- D. font stacks ----------
async function probeFonts(origin) {
  return withPage(origin, '/', { width: 1440, height: 900 }, async (page) => {
    return page.evaluate(() => {
      const fam = (el) => (el ? getComputedStyle(el).fontFamily.slice(0, 120) : null);
      return {
        body: fam(document.body),
        h1: fam(document.querySelector('h1')),
        mono: fam(document.querySelector('[class*="mono"], [class*="tracking"]')),
      };
    });
  });
}

report.head = {
  landing_src: await probeHead(SRC, '/'),
  landing_clone: await probeHead(CLONE, '/'),
  project_src: await probeHead(SRC, '/project/kinto-cafe-branding'),
  project_clone: await probeHead(CLONE, '/project/kinto-cafe-branding'),
  contact_src: await probeHead(SRC, '/contact'),
  contact_clone: await probeHead(CLONE, '/contact'),
};

report.drift = {
  landing_src: await probeText(SRC, '/'),
  landing_clone: await probeText(CLONE, '/'),
};

report.login = await probeLogin();

report.fonts = {
  src: await probeFonts(SRC),
  clone: await probeFonts(CLONE),
};

await browser.close();
console.log(JSON.stringify(report, null, 2));

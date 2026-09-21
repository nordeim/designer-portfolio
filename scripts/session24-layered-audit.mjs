/**
 * Session 24 — layered-behavior parity audit: source vs clone.
 * Covers surfaces no previous session audited:
 *   1. Dark-mode computed colors on 4 routes (theme toggle → capture palette)
 *   2. Hover states: works rows, project-index rows (invert-fill), CTA
 *   3. Contact-form select popup styling (open dropdown)
 *   4. Focus-visible rings on key interactive elements
 * Machine surfaces (robots/sitemap) are covered separately by curl.
 */
import { chromium } from 'playwright';
import fs from 'node:fs';

const CLONE = 'http://localhost:3000';
const SRC = 'https://designer-portfolio.base44.app';

const report = { darkMode: {}, hover: {}, selectPopup: {}, focusVisible: {} };

// normalize color strings to comparable rgb channels (Node-side only)
const parseColor = (c) => {
  if (!c) return null;
  const m = String(c).match(/rgba?\(([^)]+)\)/);
  if (!m) return String(c); // keep raw (oklch/lab) for report
  return m[1].split(',').map((x) => Math.round(parseFloat(x))).join(',');
};

const browser = await chromium.launch();

async function withPage(origin, vp, fn) {
  const ctx = await browser.newContext({ viewport: vp });
  const page = await ctx.newPage();
  await page.goto(origin, { waitUntil: 'networkidle', timeout: 45000 });
  await page.waitForTimeout(1200);
  const out = await fn(page);
  await ctx.close();
  return out;
}

// ---------- 1. Dark-mode computed colors ----------
async function probeDark(origin, path) {
  return withPage(origin + path, { width: 1440, height: 900 }, async (page) => {
    const toggles = page.locator('button[aria-label*="theme" i], button[aria-label*="Toggle" i]');
    const n = await toggles.count();
    let clicked = false;
    for (let i = 0; i < n; i++) {
      const b = toggles.nth(i);
      if (await b.isVisible().catch(() => false)) { await b.click(); clicked = true; break; }
    }
    if (!clicked) return { toggleFound: false };
    await page.waitForTimeout(900);
    const raw = await page.evaluate(() => {
      const h1 = document.querySelector('h1');
      const bcs = getComputedStyle(document.body);
      const hcs = h1 ? getComputedStyle(h1) : null;
      return { bodyBg: bcs.backgroundColor, h1Color: hcs ? hcs.color : null };
    });
    return {
      toggleFound: true,
      bodyBg: parseColor(raw.bodyBg),
      h1Color: parseColor(raw.h1Color),
      h1Found: raw.h1Color !== null,
    };
  });
}

for (const [name, path] of [['home', '/'], ['projects', '/projects'], ['about', '/about'], ['contact', '/contact']]) {
  report.darkMode[name] = {
    source: await probeDark(SRC, path),
    clone: await probeDark(CLONE, path),
  };
}

// ---------- 2. Hover states ----------
async function probeHoverLanding(origin) {
  return withPage(origin + '/', { width: 1440, height: 900 }, async (page) => {
    const out = {};
    const row = page.locator('a[href^="/project/"]').first();
    if (await row.count()) {
      await row.scrollIntoViewIfNeeded();
      await page.waitForTimeout(500);
      const imgBefore = await row.evaluate((el) => {
        const img = el.querySelector('img');
        return img ? getComputedStyle(img).transform.slice(0, 60) : 'no-img';
      });
      await row.hover();
      await page.waitForTimeout(900);
      const imgAfter = await row.evaluate((el) => {
        const img = el.querySelector('img');
        return img ? getComputedStyle(img).transform.slice(0, 60) : 'no-img';
      });
      out.worksRow = { imgBefore, imgAfter, changed: imgBefore !== imgAfter };
    }
    const ctas = page.locator('a', { hasText: /start a project/i });
    const cn = await ctas.count();
    for (let i = 0; i < cn; i++) {
      const cta = ctas.nth(i);
      if (!(await cta.isVisible().catch(() => false))) continue;
      const before = await cta.evaluate((el) => {
        const cs = getComputedStyle(el);
        return { bg: cs.backgroundColor, color: cs.color, opacity: cs.opacity };
      });
      await cta.hover();
      await page.waitForTimeout(600);
      const after = await cta.evaluate((el) => {
        const cs = getComputedStyle(el);
        return { bg: cs.backgroundColor, color: cs.color, opacity: cs.opacity };
      });
      out.cta = {
        before: { bg: parseColor(before.bg), color: parseColor(before.color), opacity: before.opacity },
        after: { bg: parseColor(after.bg), color: parseColor(after.color), opacity: after.opacity },
        changed: JSON.stringify(before) !== JSON.stringify(after),
      };
    }
    return out;
  });
}

async function probeHoverProjectsIndex(origin) {
  return withPage(origin + '/projects', { width: 1440, height: 900 }, async (page) => {
    const out = {};
    const row = page.locator('a[href^="/project/"]').first();
    if (await row.count()) {
      const probe = (el) => {
        const overlay = el.querySelector('.bg-foreground') || el.children[0];
        const content = el.querySelector('.relative.z-10') || el.lastElementChild;
        const ocs = overlay ? getComputedStyle(overlay) : null;
        const ccs = content ? getComputedStyle(content) : null;
        return {
          overlayTransform: ocs ? ocs.transform.slice(0, 50) : null,
          overlayOpacity: ocs ? ocs.opacity : null,
          contentColor: ccs ? ccs.color : null,
        };
      };
      const before = await row.evaluate(probe);
      await row.hover();
      await page.waitForTimeout(800);
      const after = await row.evaluate(probe);
      out.indexRow = {
        before: {
          overlayTransform: before.overlayTransform,
          overlayOpacity: before.overlayOpacity,
          contentColor: parseColor(before.contentColor),
        },
        after: {
          overlayTransform: after.overlayTransform,
          overlayOpacity: after.overlayOpacity,
          contentColor: parseColor(after.contentColor),
        },
        changed: JSON.stringify(before) !== JSON.stringify(after),
      };
    }
    return out;
  });
}

report.hover.landing = { source: await probeHoverLanding(SRC), clone: await probeHoverLanding(CLONE) };
report.hover.projectsIndex = { source: await probeHoverProjectsIndex(SRC), clone: await probeHoverProjectsIndex(CLONE) };

// ---------- 3. Select popup (contact) ----------
async function probeSelectPopup(origin) {
  return withPage(origin + '/contact', { width: 1440, height: 900 }, async (page) => {
    const triggers = page.locator('[role="combobox"], button[aria-haspopup="listbox"]');
    const n = await triggers.count();
    if (!n) return { triggerFound: false };
    let opened = false;
    for (let i = 0; i < n; i++) {
      const t = triggers.nth(i);
      if (await t.isVisible().catch(() => false)) {
        await t.click();
        opened = true;
        break;
      }
    }
    if (!opened) return { triggerFound: true, opened: false };
    await page.waitForTimeout(800);
    const listbox = page.locator('[role="listbox"]').first();
    const found = await listbox.count().catch(() => 0);
    if (!found) return { triggerFound: true, opened: true, listboxFound: false };
    const raw = await listbox.evaluate((el) => {
      const cs = getComputedStyle(el);
      return {
        bg: cs.backgroundColor,
        radius: cs.borderRadius,
        shadow: cs.boxShadow.slice(0, 70),
        itemCount: el.querySelectorAll('[role="option"], li').length,
        itemBg: (() => {
          const it = el.querySelector('[role="option"], li');
          return it ? getComputedStyle(it).backgroundColor : null;
        })(),
      };
    });
    return {
      triggerFound: true,
      opened: true,
      listboxFound: true,
      listbox: {
        bg: parseColor(raw.bg),
        radius: raw.radius,
        shadow: raw.shadow,
        itemCount: raw.itemCount,
        itemBg: parseColor(raw.itemBg),
      },
    };
  });
}

report.selectPopup = { source: await probeSelectPopup(SRC), clone: await probeSelectPopup(CLONE) };

// ---------- 4. Focus-visible ----------
async function probeFocus(origin) {
  return withPage(origin + '/', { width: 1440, height: 900 }, async (page) => {
    const out = [];
    for (let i = 0; i < 6; i++) {
      await page.keyboard.press('Tab');
      await page.waitForTimeout(250);
      const raw = await page.evaluate(() => {
        const el = document.activeElement;
        if (!el || el === document.body) return { tag: 'body' };
        const cs = getComputedStyle(el);
        const label = (el.textContent || el.getAttribute('aria-label') || '').replace(/\s+/g, ' ').trim().slice(0, 24);
        return {
          tag: el.tagName.toLowerCase(),
          label,
          outline: cs.outlineStyle + ' ' + cs.outlineColor,
          boxShadow: cs.boxShadow === 'none' ? 'none' : cs.boxShadow.slice(0, 60),
        };
      });
      out.push({
        ...raw,
        outline: raw.outline
          ? raw.outline.replace(/rgba?\(([^)]+)\)/, (m) => parseColor(m) || m)
          : raw.outline,
      });
    }
    return out;
  });
}

report.focusVisible = { source: await probeFocus(SRC), clone: await probeFocus(CLONE) };

await browser.close();
fs.writeFileSync('scripts/out/session24-layered-audit.json', JSON.stringify(report, null, 2));
console.log(JSON.stringify(report, null, 1));

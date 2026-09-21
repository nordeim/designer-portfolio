/**
 * Session 30 — dev-server verification screenshots: proves the remediated
 * codebase runs under `bun run dev` (Turbopack) and captures the session-30
 * remediated surfaces: the footer marquee storing title-case DOM text
 * (rendered visually uppercase), the footer copyright as a single DOM text
 * node, the case-study hero label's single "/06 — " static fragment, the
 * breathing logo resting at the source's 3.4s expanded hold (captured
 * mid-expanded), and the radial menu at the source's 40px link line-height
 * + renamed "Toggle projects" expander. Saved under docs/screenshots/ (51+).
 */
import { chromium } from 'playwright';

const BASE = process.env.CAPTURE_BASE ?? 'http://localhost:3000';
const OUT = 'docs/screenshots';

const browser = await chromium.launch();

// Verify the server responds before capturing.
const probe = await browser.newPage();
await probe.goto(BASE + '/login', { waitUntil: 'networkidle', timeout: 60000 });
console.log('probe: server reachable');
await probe.close();

// ---- 51: marquee band — title-case DOM, visually uppercase (session 30) ----
{
  const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 } });
  const page = await ctx.newPage();
  await page.goto(BASE + '/', { waitUntil: 'networkidle', timeout: 60000 });
  await page.evaluate(() => window.scrollTo(0, 5600));
  await page.waitForTimeout(1600);
  await page.screenshot({ path: `${OUT}/51-dev-marquee-titlecase-dom.png`, fullPage: false });
  const meta = await page.evaluate(() => {
    const track = document.querySelector('.marquee-track');
    const first = track?.querySelector('span span');
    const cs = first ? getComputedStyle(first) : null;
    return {
      domText: first?.textContent ?? null,
      textTransform: cs?.textTransform ?? null,
      fontSize: cs?.fontSize ?? null,
    };
  });
  console.log(`captured 51 (marquee DOM=${JSON.stringify(meta.domText)} tt=${meta.textTransform} fs=${meta.fontSize})`);
  await ctx.close();
}

// ---- 52: footer copyright — single DOM text node (session 30) ----
{
  const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 } });
  const page = await ctx.newPage();
  await page.goto(BASE + '/', { waitUntil: 'networkidle', timeout: 60000 });
  await page.evaluate(() => window.scrollTo(0, 6100));
  await page.waitForTimeout(1200);
  await page.screenshot({ path: `${OUT}/52-dev-footer-copyright-single-node.png`, fullPage: false });
  const meta = await page.evaluate(() => {
    const el = [...document.querySelectorAll('footer span')].find((s) => /^©/.test(s.textContent ?? ''));
    const nodes = el ? [...el.childNodes].filter((n) => n.nodeType === 3).length : 0;
    return { text: el?.textContent ?? null, textNodes: nodes };
  });
  console.log(`captured 52 (copyright nodes=${meta.textNodes} text=${JSON.stringify(meta.text)})`);
  await ctx.close();
}

// ---- 53: detail hero label — single "/06 — " fragment (session 30) ----
{
  const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 } });
  const page = await ctx.newPage();
  await page.goto(BASE + '/project/kinto-cafe-branding', { waitUntil: 'networkidle', timeout: 60000 });
  await page.waitForTimeout(1500);
  await page.screenshot({ path: `${OUT}/53-dev-detail-label-single-fragment.png`, fullPage: false });
  const meta = await page.evaluate(() => {
    const el = [...document.querySelectorAll('section span')].find((s) => /^\d\d\/06/.test((s.textContent ?? '').trim()));
    const nodes = el ? [...el.childNodes].filter((n) => n.nodeType === 3).map((n) => n.textContent) : [];
    return { nodes };
  });
  console.log(`captured 53 (hero label nodes=${JSON.stringify(meta.nodes)})`);
  await ctx.close();
}

// ---- 54: breathing logo — resting at the expanded hold (session 30) ----
{
  const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 } });
  const page = await ctx.newPage();
  await page.goto(BASE + '/', { waitUntil: 'networkidle', timeout: 60000 });
  await page.waitForTimeout(600);
  // Wait for the expanded phase (0.4s expand starts at 3.3s; hold runs 3.4s).
  let ls = -1;
  for (let i = 0; i < 40; i++) {
    ls = await page.evaluate(() => {
      const a = [...document.querySelectorAll('a')].find((el) => /^A\/M$/.test(el.textContent?.trim() ?? ''));
      const span = a?.querySelector('span');
      return span ? parseFloat(getComputedStyle(span).letterSpacing) : -1;
    });
    if (ls >= 9) break; // fully expanded (0.7em @14px = 9.8px)
    await page.waitForTimeout(200);
  }
  await page.screenshot({ path: `${OUT}/54-dev-logo-breathing-expanded-hold.png`, fullPage: false });
  console.log(`captured 54 (logo letter-spacing at capture: ${ls}px — expanded hold 3.4s, source cadence)`);
  await ctx.close();
}

// ---- 55: radial menu — 40px link line-height + "Toggle projects" (session 30) ----
{
  const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 } });
  const page = await ctx.newPage();
  await page.goto(BASE + '/', { waitUntil: 'networkidle', timeout: 60000 });
  await page.waitForTimeout(1200);
  await page.locator('button[aria-label="Open menu"]').filter({ visible: true }).click({ timeout: 15000 });
  await page.waitForTimeout(1300);
  await page.screenshot({ path: `${OUT}/55-dev-radial-menu-40px-links.png`, fullPage: false });
  const meta = await page.evaluate(() => {
    const ov = document.querySelector('[role="dialog"]');
    const home = [...(ov?.querySelectorAll('a') ?? [])].find((a) => a.textContent.trim() === 'Home');
    const toggle = [...(ov?.querySelectorAll('button') ?? [])].find((b) => /toggle projects/i.test(b.getAttribute('aria-label') ?? ''));
    const cs = home ? getComputedStyle(home) : null;
    return { lh: cs?.lineHeight ?? null, h: home ? Math.round(home.getBoundingClientRect().height) : null, toggle: toggle?.getAttribute('aria-label') ?? null };
  });
  console.log(`captured 55 (menu link lh=${meta.lh} h=${meta.h} toggle=${JSON.stringify(meta.toggle)})`);
  await ctx.close();
}

await browser.close();
console.log('done — 5 screenshots captured (51–55)');

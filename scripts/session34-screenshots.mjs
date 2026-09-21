/**
 * Session 34 — dev-server verification screenshots: proves the remediated
 * codebase runs under `bun run dev` (Turbopack) and captures the
 * session-34 remediated surfaces:
 *   59 — the sage 4px custom scrollbar rendered on a scrolled page
 *   60 — the legal eyebrow storing title-case "Legal" (CSS uppercases)
 *   61 — the footer bottom row with the hidden CTA anchor (DOM-proven)
 *   62 — the contact surface with pointer-cursor chrome + default
 *        browser-selection highlight (text selected in-shot)
 * Saved under docs/screenshots/.
 */
import { chromium } from 'playwright';

const BASE = process.env.CAPTURE_BASE ?? 'http://localhost:3000';
const OUT = 'docs/screenshots';

const browser = await chromium.launch();

const probe = await browser.newPage();
await probe.goto(BASE + '/login', { waitUntil: 'networkidle', timeout: 60000 });
console.log('probe: dev server reachable');
await probe.close();

// ---- 59: the sage custom scrollbar on a scrolled page ----
{
  const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 } });
  const page = await ctx.newPage();
  await page.goto(BASE + '/', { waitUntil: 'networkidle', timeout: 60000 });
  await page.waitForTimeout(1200);
  await page.evaluate(() => window.scrollTo(0, 2000));
  await page.waitForTimeout(600);
  await page.screenshot({ path: `${OUT}/59-dev-sage-scrollbar-4px.png`, fullPage: false });
  const meta = await page.evaluate(() => {
    const rules = [];
    for (const sheet of document.styleSheets) {
      let rs; try { rs = sheet.cssRules; } catch { continue; }
      const walk = (list) => {
        for (const rule of list) {
          if ((rule.selectorText || '').match(/^::-webkit-scrollbar(-track|-thumb)?$/)) rules.push(rule.cssText.replace(/\s+/g, ' '));
          const nested = rule.cssRules;
          if (nested) walk(nested);
        }
      };
      walk(rs);
    }
    return { scrollY: window.scrollY, scrollbarRules: rules.sort(), docHeight: document.documentElement.scrollHeight };
  });
  console.log('59:', JSON.stringify(meta));
  await ctx.close();
}

// ---- 60: the legal eyebrow — title-case DOM, visually uppercase ----
{
  const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 } });
  const page = await ctx.newPage();
  await page.goto(BASE + '/privacy', { waitUntil: 'networkidle', timeout: 60000 });
  await page.waitForTimeout(1000);
  // frame the header area (eyebrow + h1)
  const h1 = page.locator('h1');
  await h1.scrollIntoViewIfNeeded();
  await page.screenshot({ path: `${OUT}/60-dev-legal-eyebrow-titlecase-span.png`, fullPage: false, clip: { x: 0, y: 0, width: 1440, height: 320 } });
  const meta = await page.evaluate(() => {
    const el = document.querySelector('h1')?.previousElementSibling;
    const cs = el ? getComputedStyle(el) : null;
    return {
      tag: el?.tagName, domText: el?.textContent, cls: el?.getAttribute('class'),
      textTransform: cs?.textTransform, display: cs?.display, marginBottom: cs?.marginBottom,
      rendered: el?.textContent ? el.textContent.toUpperCase() === el.textContent ? 'VISUAL-UPPERCASE-VIA-CSS' : 'lower?' : null,
    };
  });
  console.log('60:', JSON.stringify(meta));
  await ctx.close();
}

// ---- 61: the footer bottom row with the hidden CTA ----
{
  const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 } });
  const page = await ctx.newPage();
  await page.goto(BASE + '/', { waitUntil: 'networkidle', timeout: 60000 });
  await page.waitForTimeout(1000);
  await page.evaluate(() => window.scrollTo(0, document.documentElement.scrollHeight));
  await page.waitForTimeout(800);
  await page.screenshot({ path: `${OUT}/61-dev-footer-hidden-cta-anchor.png`, fullPage: false });
  const meta = await page.evaluate(() => {
    const links = [...document.querySelectorAll('a[href="/contact"]')];
    const hidden = links.filter(a => getComputedStyle(a).display === 'none');
    const row = [...document.querySelectorAll('footer div')]
      .filter(d => (d.getAttribute('class') || '').startsWith('flex flex-col md:flex-row'))
      .pop();
    return {
      totalContactAnchors: links.length,
      hiddenCta: {
        count: hidden.length,
        text: (hidden[0]?.textContent || '').trim(),
        display: hidden[0] ? getComputedStyle(hidden[0]).display : null,
        firstRowChild: row?.firstElementChild === hidden[0],
        rowChildren: row ? [...row.children].map(c => c.tagName.toLowerCase()) : null,
      },
      copyrightVisible: (row?.textContent || '').includes('Built on Base44'),
    };
  });
  console.log('61:', JSON.stringify(meta));
  await ctx.close();
}

// ---- 62: pointer-cursor chrome + default browser selection on /contact ----
{
  const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 } });
  const page = await ctx.newPage();
  await page.goto(BASE + '/contact', { waitUntil: 'networkidle', timeout: 60000 });
  await page.waitForTimeout(1000);
  // select the intro paragraph text — the default browser highlight paints
  // in the shot (cobalt selection would paint brand blue instead)
  await page.evaluate(() => {
    const p = document.querySelector('main p, form p, section p');
    if (p) {
      const range = document.createRange();
      range.selectNodeContents(p);
      const sel = window.getSelection();
      sel?.removeAllRanges();
      sel?.addRange(range);
    }
  });
  await page.waitForTimeout(300);
  await page.screenshot({ path: `${OUT}/62-dev-contact-default-selection-pointer-buttons.png`, fullPage: false });
  const meta = await page.evaluate(() => {
    const submit = [...document.querySelectorAll('button')].find(b => (b.textContent || '').trim().startsWith('Send Inquiry'));
    const trigger = [...document.querySelectorAll('button')].find(b => (b.textContent || '').includes('Select a type'));
    const h1sel = getComputedStyle(document.querySelector('h1'), '::selection');
    const hasSelection = !!window.getSelection()?.toString();
    return {
      submitCursor: submit ? getComputedStyle(submit).cursor : 'ABSENT',
      triggerCursor: trigger ? getComputedStyle(trigger).cursor : 'ABSENT',
      selectionComputedBg: h1sel.backgroundColor,
      selectionPainted: hasSelection,
    };
  });
  console.log('62:', JSON.stringify(meta));
  await ctx.close();
}

await browser.close();
console.log('session-34 screenshots captured (59-62)');

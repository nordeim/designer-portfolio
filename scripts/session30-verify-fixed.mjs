import { chromium } from 'playwright';
const browser = await chromium.launch();
const results = {};
for (const [label, origin] of [['SOURCE', 'https://designer-portfolio.base44.app'], ['CLONE', 'http://localhost:3000']]) {
  const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 } });
  const page = await ctx.newPage();
  await page.goto(origin + '/', { waitUntil: 'networkidle', timeout: 60000 }).catch(() => {});
  await page.waitForTimeout(2200);
  results[label] = await page.evaluate(() => {
    // 1. marquee DOM case
    const track = document.querySelector('.marquee-track');
    const marqueeFirst = track ? (track.querySelector('span span')?.textContent ?? null) : null;
    // 2. copyright node texture
    const cr = [...document.querySelectorAll('footer span, [role="contentinfo"] span')].find((s) => /^©/.test(s.textContent ?? ''));
    const copyright = cr ? { text: cr.textContent, nodes: [...cr.childNodes].filter((n) => n.nodeType === 3).length } : null;
    // 3. works numbering fragment
    const wl = [...document.querySelectorAll("a[href^='/project/'] span")].find((s) => /^\d\d\/06/.test((s.textContent ?? '').trim()));
    const numbering = wl ? { nodes: [...wl.childNodes].filter((n) => n.nodeType === 3).map((n) => n.textContent) } : null;
    return { marqueeFirst, copyright, numbering };
  });
  // 4. logo cadence 12s @250ms
  const samples = [];
  for (let i = 0; i < 48; i++) {
    const ls = await page.evaluate(() => {
      const a = [...document.querySelectorAll('a')].find((el) => /^A\/M$/.test(el.textContent?.trim() ?? ''));
      const span = a?.querySelector('span');
      return span ? parseFloat(getComputedStyle(span).letterSpacing) : -1;
    });
    samples.push(ls >= 5 ? 1 : 0);
    await page.waitForTimeout(250);
  }
  let best = 0, run = 0, total = 0;
  for (const s of samples) { if (s) { run++; best = Math.max(best, run); total++; } else run = 0; }
  results[label].logoBreathing = { longestExpandedRunMs: best * 250, expandedFraction: Math.round((total / 48) * 100) + '%' };
  // 5. menu link lh + toggle label (desktop)
  await page.locator('button[aria-label="Open menu"]').filter({ visible: true }).click({ timeout: 15000 });
  await page.waitForTimeout(1500);
  results[label].menu = await page.evaluate(() => {
    const ov = document.querySelector('div.z-50.bg-charcoal') ?? document.querySelector('[role="dialog"]');
    if (!ov) return { error: 'no menu' };
    const home = [...ov.querySelectorAll('a')].find((a) => a.textContent.trim() === 'Home');
    const toggle = [...ov.querySelectorAll('button')].find((b) => /toggle projects/i.test(b.getAttribute('aria-label') ?? ''));
    return {
      homeLh: home ? getComputedStyle(home).lineHeight : null,
      homeH: home ? Math.round(home.getBoundingClientRect().height) : null,
      toggleLabel: toggle?.getAttribute('aria-label') ?? null,
    };
  });
  await ctx.close();
}
// detail page numbering
for (const [label, origin] of [['SOURCE', 'https://designer-portfolio.base44.app'], ['CLONE', 'http://localhost:3000']]) {
  const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 } });
  const page = await ctx.newPage();
  await page.goto(origin + '/project/kinto-cafe-branding', { waitUntil: 'networkidle', timeout: 60000 }).catch(() => {});
  await page.waitForTimeout(1800);
  results[label].detailNumbering = await page.evaluate(() => {
    const el = [...document.querySelectorAll('section span')].find((s) => /^\d\d\/06/.test((s.textContent ?? '').trim()));
    return el ? { nodes: [...el.childNodes].filter((n) => n.nodeType === 3).map((n) => n.textContent) } : null;
  });
  await ctx.close();
}
console.log(JSON.stringify(results, null, 1));
await browser.close();

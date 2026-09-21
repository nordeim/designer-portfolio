import { chromium } from 'playwright';

const SRC = 'https://designer-portfolio.base44.app';
const CLONE = 'http://localhost:3000';

const browser = await chromium.launch();

async function contactToast(origin) {
  const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 } });
  const page = await ctx.newPage();
  await page.goto(origin + '/contact', { waitUntil: 'networkidle', timeout: 45000 });
  await page.waitForTimeout(1500);
  await page.locator('form button[type="submit"]').first().click({ force: true });
  await page.waitForTimeout(2000);
  const out = await page.evaluate(() => {
    // find the toast: source = radix (data-swipe classes), clone = [role=alert] system toast
    const t = document.querySelector('[data-radix-toast-collection-item]') ||
      [...document.querySelectorAll('div')].find(d => /swipe=end/.test(String(d.className))) ||
      [...document.querySelectorAll('[role="alert"], [role="status"]')].find(e =>
        /fill in all required/i.test(e.textContent || ''));
    if (!t) return { found: false };
    const cs = getComputedStyle(t);
    const r = t.getBoundingClientRect();
    const vp = t.closest('div.fixed');
    return {
      found: true,
      text: (t.textContent || '').trim().slice(0, 60),
      bg: cs.backgroundColor, color: cs.color, radius: cs.borderRadius,
      padding: cs.padding, width: cs.width, shadow: cs.boxShadow.slice(0, 60),
      rect: { x: Math.round(r.x), y: Math.round(r.y), w: Math.round(r.width), h: Math.round(r.height) },
      viewportClass: vp ? String(vp.className).slice(0, 120) : null,
      hasClose: !!t.querySelector('button'),
      titleFont: (() => {
        const inner = t.querySelector('div.text-sm, .text-sm');
        return inner ? { size: getComputedStyle(inner).fontSize, weight: getComputedStyle(inner).fontWeight } : null;
      })(),
    };
  });
  // persistence at 8s
  await page.waitForTimeout(6000);
  out.persistentAt8s = await page.evaluate(() => {
    return [...document.querySelectorAll('[role="alert"], [role="status"]')].some(e => /fill in all required/i.test(e.textContent || '')) ||
      [...document.querySelectorAll('div')].some(d => /swipe=end/.test(String(d.className)));
  });
  await ctx.close();
  return { origin, ...out };
}

console.log(JSON.stringify([await contactToast(SRC), await contactToast(CLONE)], null, 2));
await browser.close();

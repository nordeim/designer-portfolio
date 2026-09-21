/**
 * Session 32 — final parity re-verification of the fixed surfaces.
 *   1. Reduced-motion hero (clone-only design check — the source's JS
 *      machines run under reduce by design divergence): exactly one
 *      static image, frozen dots, static typewriter, frozen logo.
 *   2. Preview row-switch crossfade vs the source (side-by-side): both
 *      origins must show 2 coexisting previews mid-switch with
 *      complementary opacities, settled to 1 afterwards.
 */
import { chromium } from 'playwright';

const browser = await chromium.launch();

// ---------- 1. clone reduced-motion hero ----------
{
  const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 }, reducedMotion: 'reduce' });
  const page = await ctx.newPage();
  await page.goto('http://localhost:3000/', { waitUntil: 'networkidle' });
  await page.waitForTimeout(1500);
  const out = await page.evaluate(async () => {
    const heroImgs = () => Array.from(document.querySelectorAll('img'))
      .map((im) => ({ r: im.getBoundingClientRect(), cs: getComputedStyle(im) }))
      .filter(({ r, cs }) => cs.display !== 'none' && cs.visibility !== 'hidden' && r.width > 0 && cs.opacity !== '0' && r.y > -80 && r.y < 700 && r.width > 40 && r.width < 500)
      .map(({ r }) => `${Math.round(r.x)},${Math.round(r.y)},${Math.round(r.width)}`);
    const a = heroImgs();
    await new Promise((r) => setTimeout(r, 2500));
    const b = heroImgs();
    const dots = Array.from(document.querySelectorAll('.bg-cobalt')).map((d) => getComputedStyle(d).transform);
    const logo = [...document.querySelectorAll('a')].find((el) => /^A\/M$/.test(el.textContent?.trim() ?? ''));
    const logoLs = logo ? getComputedStyle(logo.querySelector('span') || logo).letterSpacing : null;
    return { imgCount: a.length, stable: JSON.stringify(a) === JSON.stringify(b), img: a, dotTransforms: [...new Set(dots)], dotCount: dots.length, logoLs };
  });
  console.log('=== CLONE REDUCE HERO (fixed) ===');
  console.log(JSON.stringify(out));
  await ctx.close();
}

// ---------- 2. crossfade both origins ----------
async function crossfade(origin) {
  const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 } });
  const page = await ctx.newPage();
  await page.goto(origin + '/projects', { waitUntil: 'networkidle', timeout: 60000 }).catch(() => {});
  await page.waitForTimeout(2000);
  const rows = page.locator('a[href*="/project/"]');
  await rows.nth(0).hover();
  await page.waitForTimeout(700);
  const row1 = await rows.nth(1).boundingBox();
  await page.mouse.move(row1.x + row1.width / 2, row1.y + 20);
  const mid = await page.evaluate(() => {
    return [...document.querySelectorAll('div')]
      .filter((d) => {
        const cs = getComputedStyle(d);
        const r = d.getBoundingClientRect();
        const z = parseInt(cs.zIndex || '0', 10);
        return cs.position === 'fixed' && z >= 50 && r.width >= 150 && r.width <= 500 && r.height >= 100 && r.height <= 400;
      })
      .map((el) => ({ y: Math.round(el.getBoundingClientRect().y), op: +(+getComputedStyle(el).opacity).toFixed(3) }));
  }).catch(() => null);
  await page.waitForTimeout(580);
  const settled = await page.evaluate(() => {
    return [...document.querySelectorAll('div')]
      .filter((d) => {
        const cs = getComputedStyle(d);
        const r = d.getBoundingClientRect();
        const z = parseInt(cs.zIndex || '0', 10);
        return cs.position === 'fixed' && z >= 50 && r.width >= 150 && r.width <= 500 && r.height >= 100 && r.height <= 400;
      })
      .map((el) => ({ y: Math.round(el.getBoundingClientRect().y), op: +(+getComputedStyle(el).opacity).toFixed(3) }));
  }).catch(() => null);
  await ctx.close();
  return { mid, settled };
}
console.log('=== CROSSFADE (src) ===');
console.log(JSON.stringify(await crossfade('https://designer-portfolio.base44.app')));
console.log('=== CROSSFADE (clone fixed) ===');
console.log(JSON.stringify(await crossfade('http://localhost:3000')));

await browser.close();

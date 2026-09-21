/**
 * Session 32 — dev-server verification screenshots: proves the remediated
 * codebase runs under `bun run dev` (Turbopack) and captures the
 * session-32 remediated surfaces: the reduced-motion hero rendering its
 * STATIC constellation fallback (exactly one image + frozen dots + static
 * typewriter lines), and the /projects cursor-preview crossfade caught
 * mid-transition (two coexisting previews, complementary opacities).
 * Saved under docs/screenshots/ (56+).
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

// ---- 56: reduced-motion hero — static constellation fallback (session 32) ----
{
  const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 }, reducedMotion: 'reduce' });
  const page = await ctx.newPage();
  await page.goto(BASE + '/', { waitUntil: 'networkidle', timeout: 60000 });
  await page.waitForTimeout(1500);
  await page.screenshot({ path: `${OUT}/56-dev-reduce-hero-static-constellation.png`, fullPage: false });
  const meta = await page.evaluate(() => {
    const imgs = Array.from(document.querySelectorAll('img'))
      .map((im) => ({ r: im.getBoundingClientRect(), cs: getComputedStyle(im) }))
      .filter(({ r, cs }) => cs.display !== 'none' && cs.visibility !== 'hidden' && r.width > 0 && cs.opacity !== '0' && r.y > -80 && r.y < 700 && r.width > 40 && r.width < 500);
    const dots = Array.from(document.querySelectorAll('.bg-cobalt')).map((d) => getComputedStyle(d).transform);
    const text = document.querySelector('section[aria-label="Introduction"]')?.textContent ?? '';
    return {
      visibleImages: imgs.length,
      imageBox: imgs.length ? `${Math.round(imgs[0].r.x)},${Math.round(imgs[0].r.y)} ${Math.round(imgs[0].r.width)}x${Math.round(imgs[0].r.height)}` : null,
      dotTransforms: [...new Set(dots)],
      typewriterLines: [/GRAPHIC DESIGNER/i.test(text), /BASED: BERLIN/i.test(text), /HELLO@ALEXMOREAU\.DESIGN/i.test(text)],
      hasCursor: text.includes('|'),
    };
  });
  console.log(`captured 56 (reduce hero: images=${meta.visibleImages} box=${meta.imageBox} dotTransforms=${JSON.stringify(meta.dotTransforms)} lines=${JSON.stringify(meta.typewriterLines)} cursor=${meta.hasCursor})`);
  await ctx.close();
}

// ---- 57: /projects preview crossfade mid-transition (session 32) ----
{
  const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 } });
  const page = await ctx.newPage();
  await page.goto(BASE + '/projects', { waitUntil: 'networkidle', timeout: 60000 });
  await page.waitForTimeout(1500);
  const rows = page.locator('a[href*="/project/"]');
  await rows.nth(0).hover();
  await page.waitForTimeout(700);
  const row1 = await rows.nth(1).boundingBox();
  await page.mouse.move(row1.x + row1.width / 2, row1.y + 20);
  // catch the crossfade ~110ms in — both previews coexist
  await page.waitForTimeout(110);
  await page.screenshot({ path: `${OUT}/57-dev-preview-crossfade-midflight.png`, fullPage: false });
  const mid = await page.evaluate(() => {
    return [...document.querySelectorAll('div')]
      .filter((d) => {
        const cs = getComputedStyle(d);
        const r = d.getBoundingClientRect();
        const z = parseInt(cs.zIndex || '0', 10);
        return cs.position === 'fixed' && z >= 50 && r.width >= 150 && r.width <= 500 && r.height >= 100 && r.height <= 400;
      })
      .map((el) => {
        const r = el.getBoundingClientRect();
        const cs = getComputedStyle(el);
        return { y: Math.round(r.y), op: +(+cs.opacity).toFixed(3), scale: cs.transform !== 'none' ? +cs.transform.match(/matrix\(([\d.]+)/)?.[1] : 1 };
      });
  });
  console.log(`captured 57 (mid-crossfade els=${JSON.stringify(mid)})`);
  await ctx.close();
}

// ---- 58: reduced-motion hero zoom — frozen dots + static meta (session 32) ----
{
  const ctx = await browser.newContext({ viewport: { width: 390, height: 844 }, reducedMotion: 'reduce' });
  const page = await ctx.newPage();
  await page.goto(BASE + '/', { waitUntil: 'networkidle', timeout: 60000 });
  await page.waitForTimeout(1500);
  // zoom toward the h1 + meta line area on mobile
  await page.screenshot({ path: `${OUT}/58-dev-reduce-hero-mobile-static.png`, fullPage: false });
  const meta = await page.evaluate(() => {
    const imgs = Array.from(document.querySelectorAll('img'))
      .map((im) => ({ r: im.getBoundingClientRect(), cs: getComputedStyle(im) }))
      .filter(({ r, cs }) => cs.display !== 'none' && cs.visibility !== 'hidden' && r.width > 0 && cs.opacity !== '0' && r.y > -80 && r.y < 700 && r.width > 25 && r.width < 500);
    const text = document.querySelector('section[aria-label="Introduction"]')?.textContent ?? '';
    return { visibleImages: imgs.length, lines: [/GRAPHIC DESIGNER/i.test(text), /BASED: BERLIN/i.test(text), /HELLO@ALEXMOREAU\.DESIGN/i.test(text)] };
  });
  console.log(`captured 58 (mobile reduce: images=${meta.visibleImages} lines=${JSON.stringify(meta.lines)})`);
  await ctx.close();
}

await browser.close();
console.log('done — 56, 57, 58 captured');

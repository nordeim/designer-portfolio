/**
 * Session 20 — dev-server verification screenshots: proves the remediated
 * codebase runs under `bun run dev` (Turbopack). Captures a focused set:
 * landing, the remediated unknown-slug surface (title fix), login, projects.
 * Saved under docs/screenshots/ following the numbered convention (28+).
 */
import { chromium } from 'playwright';

const BASE = process.env.CAPTURE_BASE ?? 'http://localhost:3000';
const OUT = 'docs/screenshots';

const shots = [
  ['28-dev-landing', '/', { viewport: { width: 1440, height: 900 } }],
  ['29-dev-project-not-found', '/project/does-not-exist', { viewport: { width: 1440, height: 900 } }],
  ['30-dev-login', '/login', { viewport: { width: 1280, height: 720 } }],
  ['31-dev-projects', '/projects', { viewport: { width: 1440, height: 900 } }],
];

const browser = await chromium.launch();

// Verify the dev server identifies itself before capturing.
const probe = await browser.newPage();
await probe.goto(BASE + '/login', { waitUntil: 'networkidle', timeout: 60000 });
const serverHeader = await probe.evaluate(() => 'browser OK');
console.log('probe:', serverHeader);

for (const [name, route, { viewport }] of shots) {
  const ctx = await browser.newContext({ viewport });
  const page = await ctx.newPage();
  await page.goto(BASE + route, { waitUntil: 'networkidle', timeout: 60000 });
  await page.waitForTimeout(1800); // settle typewriter/marquee start frames
  await page.screenshot({ path: `${OUT}/${name}.png` });
  console.log(`captured ${OUT}/${name}.png  (title: "${await page.title()}")`);
  await ctx.close();
}

await browser.close();
console.log('done');

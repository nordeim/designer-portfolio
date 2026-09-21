/**
 * Session 22 — title edge sweep: the two routes the session-20 sweep script
 * did not cover inline (unknown project slug + login). Source vs clone.
 */
import { chromium } from 'playwright';

const CLONE = 'http://localhost:3000';
const SRC = 'https://designer-portfolio.base44.app';

const routes = [
  ['unknown-project-slug', '/project/nonexistent-slug'],
  ['login', '/login'],
];

const browser = await chromium.launch();
const srcCtx = await browser.newContext({ viewport: { width: 1440, height: 900 } });
const srcPage = await srcCtx.newPage();
const cloneCtx = await browser.newContext({ viewport: { width: 1440, height: 900 } });
const clonePage = await cloneCtx.newPage();

for (const [name, route] of routes) {
  await srcPage.goto(SRC + route, { waitUntil: 'networkidle', timeout: 45000 }).catch(() => {});
  await srcPage.waitForTimeout(1200);
  const srcTitle = await srcPage.title();

  await clonePage.goto(CLONE + route, { waitUntil: 'networkidle', timeout: 45000 }).catch(() => {});
  await clonePage.waitForTimeout(1200);
  const cloneTitle = await clonePage.title();

  console.log(`${name}: src="${srcTitle}" clone="${cloneTitle}" ${srcTitle === cloneTitle ? 'MATCH' : 'DIFF'}`);
}

await browser.close();

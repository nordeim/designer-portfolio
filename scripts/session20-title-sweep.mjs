/**
 * Session 20 — title sweep: source vs clone titles for the remaining edge
 * routes (standalone 404, dashboard-gated routes, project detail pages).
 */
import { chromium } from 'playwright';

const CLONE = 'http://localhost:3000';
const SRC = 'https://designer-portfolio.base44.app';

const routes = [
  ['standalone-404', '/no-such-route-anywhere'],
  ['root-level-404', '/random/deep/path'],
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

// Project detail titles for both seeded slugs (parity sanity)
for (const slug of ['kinto-cafe-branding', 'grove-packaging', 'lune-web-identity']) {
  await srcPage.goto(SRC + '/project/' + slug, { waitUntil: 'networkidle', timeout: 45000 }).catch(() => {});
  await srcPage.waitForTimeout(800);
  const srcTitle = await srcPage.title();
  await clonePage.goto(CLONE + '/project/' + slug, { waitUntil: 'networkidle', timeout: 45000 }).catch(() => {});
  await clonePage.waitForTimeout(800);
  const cloneTitle = await clonePage.title();
  console.log(`project/${slug}: src="${srcTitle}" clone="${cloneTitle}" ${srcTitle === cloneTitle ? 'MATCH' : 'DIFF'}`);
}

await browser.close();

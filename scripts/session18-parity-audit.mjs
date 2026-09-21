/**
 * Session 17 — full-route DOM parity audit: clone (:3000, logged in where
 * applicable) vs source (base44.app, logged in). For each route, captures
 * visible text content and normalized structure, then diffs.
 */
import { chromium } from 'playwright';
import fs from 'node:fs';

const CLONE = 'http://localhost:3000';
const SRC = 'https://designer-portfolio.base44.app';
const EMAIL = 'sepnetflix2023@outlook.com';
const PASSWORD = '$Abcd1234';
const CLONE_ADMIN = 'admin@alexmoreau.design';
const CLONE_PASS = 'AdminPass123';

const routes = [
  ['home', '/'],
  ['projects', '/projects'],
  ['about', '/about'],
  ['contact', '/contact'],
  ['privacy', '/privacy'],
  ['accessibility', '/accessibility'],
  ['login', '/login'],
  ['project-kinto', '/project/kinto-cafe-branding'],
  ['project-grove', '/project/grove-packaging'],
  ['404', '/project/nonexistent-slug'],
];

const snapshot = (page) => page.evaluate(() => {
  // Normalize: drop script/style, collapse whitespace, keep visible text order.
  const lines = document.body.innerText.split('\n')
    .map((s) => s.replace(/\s+/g, ' ').trim())
    .filter((s) => s.length > 0);
  return {
    lines,
    title: document.title,
    buttons: [...document.querySelectorAll('button')].map(b => b.innerText.replace(/\s+/g, ' ').trim()).filter(Boolean),
    links: [...document.querySelectorAll('a')].map(a => ({ href: (a.getAttribute('href') || '').split('?')[0], text: a.textContent.replace(/\s+/g, ' ').trim() })).filter(l => l.text),
    inputs: [...document.querySelectorAll('input,textarea,select')].map(i => ({ tag: i.tagName.toLowerCase(), type: i.type || '', id: i.id || '', name: i.name || '', placeholder: i.placeholder || '' })),
    images: [...document.querySelectorAll('img')].map(i => ({ alt: i.alt || '', src: (i.getAttribute('src') || '').split('?')[0].replace(/^https?:\/\/[^/]+/, '') })).slice(0, 40),
    h1: document.querySelector('h1')?.innerText?.trim() || null,
  };
});

const browser = await chromium.launch();

// ---- Source context (login) ------------------------------------------------
const srcCtx = await browser.newContext({ viewport: { width: 1440, height: 900 } });
const srcPage = await srcCtx.newPage();
await srcPage.goto(SRC + '/login', { waitUntil: 'networkidle', timeout: 45000 });
await srcPage.locator('input[type="email"], input[name="email"]').first().fill(EMAIL);
await srcPage.locator('input[type="password"], input[name="password"]').first().fill(PASSWORD);
await Promise.all([
  srcPage.waitForURL((u) => !String(u).includes('/login'), { timeout: 20000 }).catch(() => {}),
  srcPage.locator('button[type="submit"], button:has-text("Sign in")').first().click(),
]);
await srcPage.waitForTimeout(2500);

// ---- Clone context ----------------------------------------------------------
const cloneCtx = await browser.newContext({ viewport: { width: 1440, height: 900 } });
const clonePage = await cloneCtx.newPage();

const results = {};
for (const [name, route] of routes) {
  const src = { url: null, snap: null };
  const clone = { url: null, snap: null };

  // Source (reset to anonymous view for /login so both sides match state).
  if (route === '/login') {
    await srcPage.goto(SRC + route, { waitUntil: 'networkidle', timeout: 45000 });
    // logout state: fresh context is anonymous; reuse but clear storage
    await srcPage.evaluate(() => { localStorage.removeItem('token'); localStorage.removeItem('base44_access_token'); });
    await srcPage.goto(SRC + route, { waitUntil: 'networkidle', timeout: 45000 });
  } else {
    await srcPage.goto(SRC + route, { waitUntil: 'networkidle', timeout: 45000 }).catch(() => {});
  }
  await srcPage.waitForTimeout(1200);
  src.url = srcPage.url();
  src.snap = await snapshot(srcPage);

  await clonePage.goto(CLONE + route, { waitUntil: 'networkidle', timeout: 45000 }).catch(() => {});
  await clonePage.waitForTimeout(1200);
  clone.url = clonePage.url();
  clone.snap = await snapshot(clonePage);

  // Diff the line sets (presence-based; order-insensitive for robustness,
  // but we keep counts for volume comparison).
  const srcLines = src.snap.lines;
  const cloneLines = clone.snap.lines;
  const norm = (s) => s.toLowerCase().replace(/\s+/g, ' ').trim();
  const srcSet = new Map();
  for (const l of srcLines) srcSet.set(norm(l), (srcSet.get(norm(l)) || 0) + 1);
  const cloneSet = new Map();
  for (const l of cloneLines) cloneSet.set(norm(l), (cloneSet.get(norm(l)) || 0) + 1);

  const missing = []; // in source, not in clone
  for (const [k, v] of srcSet) if (!cloneSet.has(k)) missing.push(k);
  const extra = []; // in clone, not in source
  for (const [k, v] of cloneSet) if (!srcSet.has(k)) extra.push(k);

  const srcBtns = new Set(src.snap.buttons.map(norm));
  const cloneBtns = new Set(clone.snap.buttons.map(norm));
  const btnMissing = [...srcBtns].filter((b) => !cloneBtns.has(b));
  const btnExtra = [...cloneBtns].filter((b) => !srcBtns.has(b));

  results[name] = {
    srcTitle: src.snap.title, cloneTitle: clone.snap.title,
    srcLineCount: srcLines.length, cloneLineCount: cloneLines.length,
    missingText: missing.slice(0, 30), extraText: extra.slice(0, 30),
    btnMissing: btnMissing.slice(0, 15), btnExtra: btnExtra.slice(0, 15),
    srcH1: src.snap.h1, cloneH1: clone.snap.h1,
    srcLinkCount: src.snap.links.length, cloneLinkCount: clone.snap.links.length,
    srcInputs: src.snap.inputs.length, cloneInputs: clone.snap.inputs.length,
    inputDiff: JSON.stringify(src.snap.inputs) !== JSON.stringify(clone.snap.inputs),
  };
}

fs.writeFileSync('scripts/out/parity-audit.json', JSON.stringify(results, null, 2));

for (const [name, r] of Object.entries(results)) {
  const gaps = r.missingText.length + r.btnMissing.length;
  console.log(`\n=== ${name} ===  (src lines: ${r.srcLineCount}, clone lines: ${r.cloneLineCount}, gaps: ${gaps})`);
  if (r.missingText.length) console.log('  MISSING text:', JSON.stringify(r.missingText.slice(0, 12)));
  if (r.btnMissing.length) console.log('  MISSING buttons:', JSON.stringify(r.btnMissing));
  if (r.btnExtra.length) console.log('  EXTRA buttons:', JSON.stringify(r.btnExtra));
  if (r.inputDiff) console.log('  NOTE: input structures differ (src:', r.srcInputs, 'clone:', r.cloneInputs, ')');
}

await browser.close();

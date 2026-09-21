/**
 * Session 17 — visual parity diff for the remediated surfaces (login,
 * standalone 404, project-not-found) vs the live reference, plus a capture
 * of the legal pages for the record.
 */
import { chromium } from 'playwright';
import fs from 'node:fs';
import { execSync } from 'node:child_process';

const CLONE = 'http://localhost:3000';
const SRC = 'https://designer-portfolio.base44.app';
const EMAIL = 'sepnetflix2023@outlook.com';
const PASSWORD = '$Abcd1234';

const shots = [
  ['login', '/login'],
  ['notfound-route', '/no-such-route-anywhere'],
  ['project-notfound', '/project/nonexistent-slug'],
  ['privacy', '/privacy'],
  ['accessibility', '/accessibility'],
];

const browser = await chromium.launch();
const vp = { width: 1280, height: 720 };

// Source (login state not needed for these routes).
const srcCtx = await browser.newContext({ viewport: vp });
const srcPage = await srcCtx.newPage();
const cloneCtx = await browser.newContext({ viewport: vp });
const clonePage = await cloneCtx.newPage();

const results = {};
for (const [name, route] of shots) {
  await srcPage.goto(SRC + route, { waitUntil: 'networkidle', timeout: 45000 }).catch(() => {});
  await srcPage.waitForTimeout(1000);
  await srcPage.screenshot({ path: `scripts/out/diff-src-${name}.png` });

  await clonePage.goto(CLONE + route, { waitUntil: 'networkidle', timeout: 45000 }).catch(() => {});
  await clonePage.waitForTimeout(1000);
  await clonePage.screenshot({ path: `scripts/out/diff-clone-${name}.png` });
  console.log('captured', name);
}

await browser.close();

// Pixel diff via a tiny PNG compare (same-size only; report raw ratio).
for (const [name] of shots) {
  try {
    const out = execSync(
      `python3 - <<'EOF'
from PIL import Image, ImageChops
a = Image.open('scripts/out/diff-src-${name}.png').convert('RGB')
b = Image.open('scripts/out/diff-clone-${name}.png').convert('RGB')
if a.size != b.size:
    print('${name}: SIZE MISMATCH', a.size, b.size)
else:
    diff = ImageChops.difference(a, b)
    bbox = diff.getbbox()
    hist = diff.convert('L').histogram()
    total = a.size[0] * a.size[1]
    changed = total - hist[0]  # pixels with any channel diff
    print('${name}: identical-pixels %.2f%% (%d/%d changed) bbox=%s' % (100 * (1 - changed / total), changed, total, bbox))
EOF`,
      { encoding: 'utf-8' },
    );
    console.log(out.trim());
  } catch (e) {
    console.log(name, 'diff failed', String(e).slice(0, 200));
  }
}

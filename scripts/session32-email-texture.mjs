/**
 * Session 32 — targeted probe: the hero email link's text-node texture.
 * The drift sweep found src stores "hello@alexmo"+"reau…"-style splits vs
 * the clone's different split. Dump the exact node structure of every
 * occurrence of the email on both origins.
 */
import { chromium } from 'playwright';

const browser = await chromium.launch();
const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 } });
const page = await ctx.newPage();

for (const origin of ['https://designer-portfolio.base44.app', 'http://localhost:3000']) {
  await page.goto(origin + '/', { waitUntil: 'networkidle', timeout: 60000 }).catch(() => {});
  await page.waitForTimeout(2000);
  const out = await page.evaluate(() => {
    const hits = [];
    for (const el of document.querySelectorAll('a, p, span, div, h1, h2, h3, h4')) {
      // element whose direct text content mentions the email domain
      const ownText = [...el.childNodes].filter((n) => n.nodeType === 3).map((n) => n.textContent).join('');
      if (/alexmo|moreau\.design|@alex/i.test(ownText) && ownText.trim().length < 120) {
        hits.push({
          tag: el.tagName,
          href: el.getAttribute('href'),
          childTextNodeCount: [...el.childNodes].filter((n) => n.nodeType === 3).length,
          textNodes: [...el.childNodes].filter((n) => n.nodeType === 3).map((n) => JSON.stringify(n.textContent)),
          fullText: JSON.stringify(el.textContent),
        });
      }
    }
    return hits.slice(0, 6);
  });
  console.log('=== ' + origin + ' ===');
  console.log(JSON.stringify(out, null, 1));
}
await browser.close();

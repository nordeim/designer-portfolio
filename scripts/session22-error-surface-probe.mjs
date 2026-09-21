/**
 * Session 22 — precise probe: WHERE does the source render the contact
 * empty-submit error + login empty-submit behavior + login invalid-cred
 * error styling. Extracts the exact DOM/CSS of the error surfaces.
 */
import { chromium } from 'playwright';

const SRC = 'https://designer-portfolio.base44.app';
const CLONE = 'http://localhost:3000';

const browser = await chromium.launch();

async function contactErrorSurface(origin, label) {
  const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 } });
  const page = await ctx.newPage();
  await page.goto(origin + '/contact', { waitUntil: 'networkidle', timeout: 45000 });
  await page.waitForTimeout(1500);
  const submitBtn = page.locator('form button[type="submit"], form button').last();
  const out = { origin: label };
  if (await submitBtn.count() > 0) {
    await submitBtn.click({ force: true }).catch(() => {});
    await page.waitForTimeout(2500);
    // find the error element and extract its full anatomy
    out.errorAnatomy = await page.evaluate(() => {
      const els = [...document.querySelectorAll('*')].filter(e =>
        e.children.length === 0 && /fill in all required|Please fill/i.test(e.textContent || ''));
      return els.map(e => {
        const cs = getComputedStyle(e);
        const r = e.getBoundingClientRect();
        // climb to the styled parent (the likely banner)
        const parent = e.parentElement ? e.parentElement : null;
        const pcs = parent ? getComputedStyle(parent) : null;
        return {
          tag: e.tagName,
          text: e.textContent,
          parentTag: parent ? parent.tagName : null,
          parentClass: parent ? parent.className : null,
          parentStyle: pcs ? {
            bg: pcs.backgroundColor, color: pcs.color, border: pcs.border,
            radius: pcs.borderRadius, padding: pcs.padding, fontSize: pcs.fontSize,
            fontWeight: pcs.fontWeight, display: pcs.display, marginTop: pcs.marginTop,
          } : null,
          rect: { x: r.x, y: r.y, w: r.width, h: r.height },
        };
      });
    });
    // any red/destructive-styled text near the form?
    out.redTexts = await page.evaluate(() => {
      const els = [...document.querySelectorAll('*')].filter(e => {
        if (e.children.length > 0) return false;
        const cs = getComputedStyle(e);
        const c = cs.color;
        return /rgb\(2[0-5]\d, [0-6]\d, [0-6]\d\)|red|#ef4444|#dc2626/i.test(c) && (e.textContent || '').trim();
      });
      return els.map(e => ({ text: e.textContent.trim().slice(0, 80), color: getComputedStyle(e).color })).slice(0, 10);
    });
  }
  await ctx.close();
  return out;
}

async function loginBehavior(origin, label) {
  const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 } });
  const page = await ctx.newPage();
  await page.goto(origin + '/login', { waitUntil: 'networkidle', timeout: 45000 });
  await page.waitForTimeout(1500);
  const out = { origin: label };
  // input attributes
  out.inputAttrs = await page.evaluate(() => {
    return [...document.querySelectorAll('input')].map(i => ({
      type: i.type, required: i.required, name: i.name, autocomplete: i.autocomplete, placeholder: i.placeholder,
    }));
  });
  // form checkValidity + what happens on empty submit
  out.formValidity = await page.evaluate(() => {
    const f = document.querySelector('form');
    return f ? { checkValidity: f.checkValidity(), noValidate: f.noValidate } : null;
  });
  const submit = page.locator('button[type="submit"]').first();
  await submit.click({ force: true }).catch(() => {});
  await page.waitForTimeout(2000);
  out.afterEmpty = await page.evaluate(() => {
    const els = [...document.querySelectorAll('*')].filter(e =>
      e.children.length === 0 && /required|valid|at least|enter/i.test(e.textContent || '') && (e.textContent || '').length < 80);
    return els.map(e => e.textContent.trim()).slice(0, 8);
  });
  // invalid credentials — error anatomy
  const emailInput = page.locator('input[type="email"], input[name="email"]').first();
  const passInput = page.locator('input[type="password"]').first();
  if (await emailInput.count() > 0 && await passInput.count() > 0) {
    await emailInput.fill('nobody@example.com');
    await passInput.fill('wrong-password');
    await page.locator('button[type="submit"]').first().click();
    await page.waitForTimeout(3000);
    out.invalidCredAnatomy = await page.evaluate(() => {
      const els = [...document.querySelectorAll('*')].filter(e =>
        e.children.length === 0 && /invalid email/i.test(e.textContent || ''));
      return els.map(e => {
        const parent = e.parentElement;
        const pcs = parent ? getComputedStyle(parent) : null;
        return {
          text: e.textContent,
          parentClass: parent ? String(parent.className).slice(0, 200) : null,
          parentStyle: pcs ? {
            bg: pcs.backgroundColor, color: pcs.color, border: pcs.borderColor,
            radius: pcs.borderRadius, padding: pcs.padding,
          } : null,
        };
      });
    });
  }
  await ctx.close();
  return out;
}

const srcContact = await contactErrorSurface(SRC, 'source');
const cloneContact = await contactErrorSurface(CLONE, 'clone');
const srcLogin = await loginBehavior(SRC, 'source');
const cloneLogin = await loginBehavior(CLONE, 'clone');

console.log(JSON.stringify({ srcContact, cloneContact, srcLogin, cloneLogin }, null, 2));
await browser.close();

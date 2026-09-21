import { test, expect } from "@playwright/test";

/**
 * Public surface: every route renders with the reference app's content and
 * chrome. Runs against the dev server (see playwright.config.ts).
 */

test("landing renders the hero, works index, philosophy, and footer marquee", async ({ page }) => {
  await page.goto("/");
  await expect(page).toHaveTitle("Designer Portfolio");

  // Header chrome: breathing logo, menu button, fixed corner CTA.
  await expect(page.getByRole("link", { name: "Alex Moreau — home" })).toBeVisible();
  await expect(page.getByRole("button", { name: "Open menu" })).toBeVisible();
  await expect(page.getByRole("link", { name: "Start a Project →" })).toBeVisible();

  // Hero name + typewriter meta line.
  await expect(page.getByRole("heading", { level: 1, name: "Alex Moreau" })).toBeVisible();
  // DOM text is mixed-case; the hero renders it uppercase via CSS (parity).
  await expect(page.getByText("Graphic Designer")).toBeVisible({ timeout: 10_000 });

  // Selected Works: 3 rows with the reference's hardcoded 06 denominator.
  const works = page.getByLabel("Selected Works");
  await expect(works.getByText("01/06 — 2035").first()).toBeVisible();
  await expect(works.getByRole("heading", { name: "Kinto" })).toBeVisible();
  await expect(works.getByRole("heading", { name: "The Blue Shift" })).toBeVisible();
  await expect(works.getByRole("heading", { name: "ST.Lab" })).toBeVisible();
  await expect(works.getByRole("link", { name: /All Projects →/ })).toBeVisible();

  // Philosophy statement + underlined links.
  await expect(page.getByLabel("Design Philosophy").getByText(/design is not decoration/)).toBeVisible();
  await expect(page.getByRole("link", { name: "Read My Story →" })).toBeVisible();
  await expect(page.getByRole("link", { name: "Start a Conversation →" })).toBeVisible();

  // Footer: ghost marquee + columns + copyright line.
  const footer = page.getByRole("contentinfo");
  await expect(footer.locator(".marquee-track")).toBeVisible();
  await expect(footer.getByRole("heading", { name: "Navigation" })).toBeVisible();
  await expect(footer.getByText("© 2026 Alex Moreau. Built on Base44.")).toBeVisible();
});

test("project archive lists all published projects with numbering", async ({ page }) => {
  await page.goto("/projects");
  await expect(page.getByRole("heading", { level: 1, name: "Projects" })).toBeVisible();
  for (const title of ["Kinto", "The Blue Shift", "ST.Lab", "Squeez'd", "Vexta"]) {
    await expect(page.getByRole("link", { name: new RegExp(title) }).first()).toBeVisible();
  }
  await expect(page.getByText("05").first()).toBeVisible();
});

test("about page renders the portrait, timeline, and proficiency matrix", async ({ page }) => {
  await page.goto("/about");
  await expect(page.getByRole("heading", { level: 1, name: /Brands that mean something/ })).toBeVisible();
  await expect(page.getByAltText("Alex Moreau — portrait")).toBeVisible();
  await expect(page.getByRole("heading", { name: "Experience & Education" })).toBeVisible();
  await expect(page.getByText("Independent Brand Studio")).toBeVisible();
  await expect(page.getByRole("heading", { name: "Software & Technical Proficiency" })).toBeVisible();
  // Sage dots mark the tool list.
  await expect(page.getByLabel("Technical proficiency").locator(".bg-sage").first()).toBeVisible();
});

test("contact page renders headline, underline form, FAQ, and info columns", async ({ page }) => {
  await page.goto("/contact");
  await expect(page.getByRole("heading", { level: 1, name: /remarkable together/ })).toBeVisible();
  await expect(page.getByLabel("Project inquiry form").getByLabel("Name *")).toBeVisible();
  await expect(page.getByLabel("Project inquiry form").getByRole("button", { name: "Send Inquiry" })).toBeVisible();
  await expect(page.getByText("hello@alexmoreau.design").first()).toBeVisible();
  await expect(page.getByLabel("Contact information").getByText("Berlin, Germany")).toBeVisible();
});

test("display headings use the source's default line-heights (session 26 parity)", async ({ page }) => {
  // Source-measured: the reference's display h1s carry NO leading-*
  // utility — text-7xl/text-6xl defaults apply (lh 1.0: 72px / 60px). Our
  // added leading-tight (1.25) inflated every contact/about h1 by 25%,
  // pushing the whole page flow down ~36px.
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto("/contact");
  const contactLh = await page.locator("h1").evaluate((el) => getComputedStyle(el).lineHeight);
  expect(contactLh).toBe("72px");

  await page.goto("/about");
  const aboutLh = await page.locator("h1").evaluate((el) => getComputedStyle(el).lineHeight);
  expect(aboutLh).toBe("60px");
});

test("legal-page h1s use the source's mobile size and margin (session 26 parity)", async ({ page }) => {
  // Source-measured: privacy/accessibility h1 = text-5xl md:text-6xl with
  // mb-16 (64px) — the clone shipped text-4xl mobile + mb-10.
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/privacy");
  const h1 = page.locator("h1");
  const fs = await h1.evaluate((el) => getComputedStyle(el).fontSize);
  expect(fs).toBe("48px"); // text-5xl at mobile — the source's size
  await page.setViewportSize({ width: 1440, height: 900 });
  const mb = await h1.evaluate((el) => getComputedStyle(el).marginBottom);
  expect(mb).toBe("64px");
});

test("FAQ accordion matches the reference typography (session 26 parity)", async ({ page }) => {
  // Source-measured: trigger = text-base (16px) font-medium (500) with
  // py-6 → 72px tall; content wraps in an inner <p class="... max-w-2xl">
  // with pb-6 → the open panel measures 128px on the 1440 layout. The
  // clone shipped text-lg font-light py-4 (60px) and an unconstrained
  // panel (68px).
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto("/contact");
  const trigger = page.getByRole("button", { name: /typical process/i });
  const fs = await trigger.evaluate((el) => getComputedStyle(el).fontSize);
  expect(fs).toBe("16px");
  const fw = await trigger.evaluate((el) => getComputedStyle(el).fontWeight);
  expect(fw).toBe("500");
  const h = await trigger.evaluate((el) => Math.round(el.getBoundingClientRect().height));
  expect(h).toBe(72);

  await trigger.click();
  await page.waitForTimeout(1200); // let the accordion animation settle
  const panel = page.locator("[data-slot='accordion-content'][data-state='open']").first();
  const p = panel.locator("p").first();
  await expect(p).toBeVisible();
  const maxW = await p.evaluate((el) => getComputedStyle(el).maxWidth);
  expect(maxW).toBe("672px"); // max-w-2xl — the source's measure
  const panelH = await panel.evaluate((el) => Math.round(el.getBoundingClientRect().height));
  expect(panelH).toBe(128);
});

test("form fields keep the source's 12px inset and 48px selects (session 26 parity)", async ({ page }) => {
  // Source-measured: the reference's inquiry fields keep the base px-3
  // (12px horizontal text inset) and its select triggers render h-12
  // (48px) like the inputs. The clone shipped px-0 and let the shadcn
  // base's data-[size=default]:h-9 collapse the triggers to 36px.
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto("/contact");
  const name = page.getByLabel("Name *", { exact: true });
  const pad = await name.evaluate((el) => getComputedStyle(el).paddingLeft);
  expect(pad).toBe("12px");

  const details = page.getByLabel("Project Details *");
  const taPad = await details.evaluate((el) => getComputedStyle(el).paddingLeft);
  expect(taPad).toBe("12px");

  const form = page.getByLabel("Project inquiry form");
  const combo = form.getByRole("combobox", { name: "Project Type" });
  const comboH = await combo.evaluate((el) => Math.round(el.getBoundingClientRect().height));
  expect(comboH).toBe(48);
});

test("contact form starts with placeholder selects and four social links (source parity)", async ({ page }) => {
  // The reference app's form state starts empty: the three select triggers
  // show their placeholders until the visitor picks a value — ours must not
  // pre-fill defaults. The Social column lists all four networks with the
  // "↗" arrow suffix, like the reference.
  await page.goto("/contact");
  const form = page.getByLabel("Project inquiry form");
  await expect(form.getByRole("combobox", { name: "Project Type" })).toHaveText("Select a type");
  await expect(form.getByRole("combobox", { name: "Budget Range" })).toHaveText("Select range");
  await expect(form.getByRole("combobox", { name: "Timeline" })).toHaveText("Select timeline");

  const social = page.getByLabel("Contact information").getByRole("link").filter({ hasText: "↗" });
  await expect(social).toHaveCount(4);
  await expect(social.filter({ hasText: "X / Twitter ↗" })).toBeVisible();
  await expect(social.filter({ hasText: "Dribbble ↗" })).toBeVisible();
});

test("legal pages render with the reference section anatomy", async ({ page }) => {
  await page.goto("/privacy");
  await expect(page.getByRole("heading", { name: "Privacy Policy", exact: true })).toBeVisible();
  // Source section headings (structure mirrored; content is real, not the
  // reference's unfilled template placeholders).
  await expect(page.getByRole("heading", { name: "A legal disclaimer" })).toBeVisible();
  await expect(page.getByRole("heading", { name: "Privacy Policy - the basics" })).toBeVisible();
  await expect(page.getByRole("heading", { name: "What to include in the Privacy Policy" })).toBeVisible();

  await page.goto("/accessibility");
  await expect(page.getByRole("heading", { name: "Accessibility", exact: true })).toBeVisible();
  await expect(page.getByRole("heading", { name: "Accessibility Statement" })).toBeVisible();
  await expect(page.getByRole("heading", { name: "What web accessibility is" })).toBeVisible();
  await expect(page.getByRole("heading", { name: "Accessibility adjustments on this site" })).toBeVisible();
  await expect(page.getByRole("heading", { name: /Declaration of partial compliance/ })).toBeVisible();
  await expect(page.getByRole("heading", { name: /Accessibility arrangements/ })).toBeVisible();
  await expect(page.getByRole("heading", { name: "Requests, issues and suggestions" })).toBeVisible();
  // The reference's 8-item adjustments list (ours states real adjustments).
  const adjustments = page.getByRole("list", { name: "Accessibility adjustments" });
  await expect(adjustments.getByRole("listitem")).toHaveCount(8);
});

test("unmatched route renders the standalone 404 (source parity)", async ({ page }) => {
  const response = await page.goto("/no-such-route-anywhere");
  expect(response?.status()).toBe(404);
  // Source stack: big light "404", medium "Page Not Found", the quoted
  // pathname, and a bordered "Go Home" button — no site chrome.
  const big404 = page.getByRole("heading", { name: "404", exact: true });
  await expect(big404).toBeVisible();
  const fs = await big404.evaluate((el) => getComputedStyle(el).fontSize);
  expect(parseFloat(fs)).toBeGreaterThanOrEqual(64);
  await expect(page.getByRole("heading", { name: "Page Not Found" })).toBeVisible();
  await expect(page.getByText('The page "/no-such-route-anywhere" could not be found', { exact: false })).toBeVisible();
  await expect(page.getByRole("link", { name: "Go Home" })).toBeVisible();
  await expect(page.getByText("A/M")).toHaveCount(0);
});

test("health endpoint reports ok", async ({ request }) => {
  const res = await request.get("/api/health");
  expect(res.status()).toBe(200);
  const body = await res.json();
  expect(body.status).toBe("ok");
  expect(body.db).toBe(true);
});

test("robots.txt serves the dynamic contract (no static shadow)", async ({ request }) => {
  // The documented contract (AGENTS.md): wildcard rule, admin routes
  // disallowed, sitemap linked — served by src/app/robots.ts. A stale
  // public/robots.txt once shadowed this route (5 bot-specific rules, no
  // Disallow, no Sitemap line) — "Googlebot" is its fingerprint and must
  // never reappear.
  const res = await request.get("/robots.txt");
  expect(res.status()).toBe(200);
  const body = await res.text();
  // Next's generator emits "User-Agent" (capital A) — the robots protocol is
  // case-insensitive, so match either casing.
  expect(body).toMatch(/^user-agent:\s?\*$/im);
  expect(body).toContain("Disallow: /dashboard");
  expect(body).toContain("Disallow: /login");
  expect(body).toMatch(/^Sitemap: .+\/sitemap\.xml$/m);
  expect(body).not.toContain("Googlebot");
});

test("sitemap.xml matches the reference route set (6 routes, weekly, 1.0/0.8)", async ({ request }) => {
  // Source ground truth: exactly 6 routes in this order — home (trailing
  // slash), about, projects, contact, privacy, accessibility — all weekly,
  // priorities 1.0 (home) / 0.8 (others). The reference omits project
  // detail pages from its sitemap; the clone matches (they stay SSG'd and
  // internally linked).
  const res = await request.get("/sitemap.xml");
  expect(res.status()).toBe(200);
  expect(res.headers()["content-type"]).toContain("xml");
  const xml = await res.text();
  expect(xml).toContain('<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">');

  const locs = [...xml.matchAll(/<loc>([^<]+)<\/loc>/g)].map((m) => m[1]);
  expect(locs).toHaveLength(6);
  const paths = locs.map((l) => l.replace(/^https?:\/\/[^/]+/, ""));
  expect(paths).toEqual(["/", "/about", "/projects", "/contact", "/privacy", "/accessibility"]);
  expect(xml).not.toContain("/project/");

  const freqs = [...xml.matchAll(/<changefreq>([^<]+)<\/changefreq>/g)].map((m) => m[1]);
  expect(freqs).toHaveLength(6);
  for (const f of freqs) expect(f).toBe("weekly");

  const prios = [...xml.matchAll(/<priority>([^<]+)<\/priority>/g)].map((m) => m[1]);
  expect(prios).toHaveLength(6);
  expect(prios[0]).toBe("1.0");
  for (const p of prios.slice(1)) expect(p).toBe("0.8");
});

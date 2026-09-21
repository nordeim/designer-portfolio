import { test, expect } from "@playwright/test";

/**
 * Authentication: credentials sign-in gates the dashboard, rejects bad
 * credentials, and the menu overlay works on the public chrome.
 * NOTE: the invalid-credentials test uses a throwaway address — the login
 * throttle (5 attempts / 10 min / email) buckets per email, so the seeded
 * owner never gets throttled by test runs.
 */

const EMAIL = process.env.E2E_ADMIN_EMAIL ?? "admin@alexmoreau.design";
const PASSWORD = process.env.E2E_ADMIN_PASSWORD ?? "";
const SLUG = "kinto-cafe-branding";

test("login page offers Google, forgot-password and sign-up affordances", async ({ page }) => {
  await page.goto("/login");
  await expect(page.getByRole("heading", { name: /Welcome to Designer Portfolio/ })).toBeVisible();
  await expect(page.getByRole("button", { name: "Continue with Google" })).toBeVisible();
  await expect(page.getByRole("button", { name: "Forgot password?" })).toBeVisible();
  await expect(page.getByRole("button", { name: "Need an account? Sign up" })).toBeVisible();
  // The sign-up affordance explains the single-owner design.
  await page.getByRole("button", { name: "Need an account? Sign up" }).click();
  await expect(page.getByText(/single owner account/i)).toBeVisible();
});

test("login card matches the reference auth-screen design", async ({ page }) => {
  await page.goto("/login");

  // Reference stack: gradient page, rounded-2xl card with shadow + accent
  // line, 80/96px avatar circle with a bold initial, centered bold heading.
  const card = page.getByRole("region", { name: "Sign in" });
  await expect(card).toBeVisible();
  const heading = page.getByRole("heading", { name: /Welcome to Designer Portfolio/ });
  const headingWeight = await heading.evaluate((el) => getComputedStyle(el).fontWeight);
  expect(parseInt(headingWeight, 10)).toBeGreaterThanOrEqual(600);

  const avatarText = page.getByText("D", { exact: true });
  await expect(avatarText).toBeVisible();
  // The circle filling the initial (80px base, 96px at sm): the glyph's
  // parent span is the full-size inner circle of the avatar.
  const avatar = avatarText.locator("xpath=..");
  const avatarBox = await avatar.boundingBox();
  expect(avatarBox).not.toBeNull();
  expect(avatarBox!.width).toBeGreaterThanOrEqual(76); // 80 desktop (sm: 96)
  expect(avatarBox!.height).toBeGreaterThanOrEqual(76);

  // Fields carry the reference's inline Mail / Lock adornment icons.
  const emailIcon = page.locator("div:has(> svg.lucide-mail)").first();
  await expect(emailIcon).toBeAttached();
  const lockIcon = page.locator('div:has(> svg.lucide-lock)').first();
  await expect(lockIcon).toBeAttached();

  // Sentence-case, full-width primary button (the reference's dark pill is
  // rounded-[12px], 48px tall — not the portfolio's label-mono ALL-CAPS).
  const submit = page.getByRole("button", { name: "Sign in", exact: true });
  await expect(submit).toBeVisible();
  const submitBox = await submit.boundingBox();
  expect(submitBox!.height).toBeGreaterThanOrEqual(44);
  // The reference's primary button is dark (slate-900) with white text.
  const submitColor = await submit.evaluate((el) => getComputedStyle(el).color);
  const m = submitColor.match(/rgba?\((\d+),\s*(\d+),\s*(\d+)/);
  expect(m).not.toBeNull();
  expect(Number(m![1])).toBeGreaterThan(200); // white-ish text on dark bg
  expect(Number(m![2])).toBeGreaterThan(200);
  expect(Number(m![3])).toBeGreaterThan(200);

  // Forgot / sign-up sit on one bottom row (justify-between), like the source.
  const forgot = page.getByRole("button", { name: "Forgot password?" });
  const signup = page.getByRole("button", { name: "Need an account? Sign up" });
  const forgotBox = await forgot.boundingBox();
  const signupBox = await signup.boundingBox();
  expect(Math.abs((forgotBox!.y + forgotBox!.height / 2) - (signupBox!.y + signupBox!.height / 2))).toBeLessThan(6);

  // The OR divider (session 22): the reference's shadcn pattern — a full-width
  // hairline passing under a white-backed, uppercase-rendered "or" label in
  // slate-500 with medium weight + tracking, 12px.
  const divider = page.locator("div.relative.flex.justify-center span");
  await expect(divider).toHaveText(/^or$/);
  const dividerStyle = await divider.evaluate((el) => {
    const cs = getComputedStyle(el);
    return {
      textTransform: cs.textTransform, fontSize: cs.fontSize, fontWeight: cs.fontWeight,
      bg: cs.backgroundColor, paddingLeft: cs.paddingLeft,
    };
  });
  expect(dividerStyle.textTransform).toBe("uppercase");
  expect(dividerStyle.fontSize).toBe("12px");
  expect(parseInt(dividerStyle.fontWeight, 10)).toBeGreaterThanOrEqual(500);
  expect(dividerStyle.bg).toBe("rgb(255, 255, 255)"); // bg-white over the hairline
  expect(dividerStyle.paddingLeft).toBe("12px"); // px-3
});

test("invalid credentials are rejected without leaking internals", async ({ page }) => {
  await page.goto("/login");
  await page.getByRole("textbox", { name: "Email", exact: true }).fill("nobody@example.com");
  await page.getByRole("textbox", { name: "Password", exact: true }).fill("definitely-wrong-password");
  await page.getByRole("button", { name: "Sign in" }).click();
  const alert = page.getByRole("alert").filter({ hasText: /^Invalid email or password$/ });
  await expect(alert).toBeVisible({ timeout: 10_000 });
  await expect(page).toHaveURL(/\/login/);

  // Source-parity alert anatomy (session 22): the reference renders the
  // failure as a light-red system alert card — bg-red-50/70, border-red-200,
  // 12px radius, 16px padding — not inline red text. Colors are normalized
  // through a canvas because Tailwind v4 emits oklab()/lab() computed strings.
  const box = await alert.evaluate((el) => {
    const norm = (c: string): number[] => {
      const cv = document.createElement("canvas");
      cv.width = cv.height = 1;
      const ctx = cv.getContext("2d");
      if (!ctx) return [];
      ctx.fillStyle = c;
      ctx.fillRect(0, 0, 1, 1);
      const d = ctx.getImageData(0, 0, 1, 1).data;
      return [d[0], d[1], d[2], d[3]];
    };
    const cs = getComputedStyle(el);
    return {
      bg: norm(cs.backgroundColor),
      border: norm(cs.borderColor),
      radius: cs.borderRadius,
      padding: cs.padding,
    };
  });
  expect(box.bg.slice(0, 3)).toEqual([254, 242, 242]); // bg-red-50/70
  expect(Math.round(box.bg[3] / 255 * 100) / 100).toBe(0.7); // the /70 alpha
  // Tailwind v4 emits oklch colors that round ±1–2 channels vs v3's rgb.
  const [br, bg2, bb] = box.border;
  expect(Math.abs(br - 254)).toBeLessThanOrEqual(2); // border-red-200
  expect(Math.abs(bg2 - 202)).toBeLessThanOrEqual(2);
  expect(Math.abs(bb - 202)).toBeLessThanOrEqual(2);
  expect(box.radius).toBe("12px");
  expect(box.padding).toBe("16px");

  // The source shows no toast on the login failure path.
  await expect(page.locator("[data-sonner-toast]")).toHaveCount(0);
});

test("login empty submit is blocked by native validation (source parity)", async ({ page }) => {
  await page.goto("/login");
  await page.getByRole("button", { name: "Sign in", exact: true }).click();
  // The reference's inputs carry required + type=email — the browser blocks
  // the submit natively; no client-side inline errors render.
  await expect(page).toHaveURL(/\/login/);
  const validity = await page.locator("form").evaluate((f) => (f as HTMLFormElement).checkValidity());
  expect(validity).toBe(false);
  await expect(page.getByText(/valid email address|at least 8 characters/i)).toHaveCount(0);
});

test("short password surfaces the source-parity alert, not a client-side message", async ({ page }) => {
  await page.goto("/login");
  await page.getByRole("textbox", { name: "Email", exact: true }).fill("shortpw-probe@example.com");
  await page.getByRole("textbox", { name: "Password", exact: true }).fill("abc");
  await page.getByRole("button", { name: "Sign in" }).click();
  // The reference never differentiates short passwords: any failed sign-in
  // renders the same alert box.
  const alert = page.getByRole("alert").filter({ hasText: /^Invalid email or password$/ });
  await expect(alert).toBeVisible({ timeout: 10_000 });
  await expect(page.getByText(/at least 8 characters/i)).toHaveCount(0);
});

test("login inputs focus with the reference's slate-400 ring (not cobalt)", async ({ page }) => {
  await page.goto("/login");
  const email = page.getByRole("textbox", { name: "Email", exact: true });
  await email.focus();
  // The input transitions its shadow — wait past the 150ms transition before
  // reading the effective ring.
  await page.waitForTimeout(400);
  const ring = await email.evaluate((el) => {
    const norm = (c: string): number[] => {
      const cv = document.createElement("canvas");
      cv.width = cv.height = 1;
      const ctx = cv.getContext("2d");
      if (!ctx) return [];
      ctx.fillStyle = c;
      ctx.fillRect(0, 0, 1, 1);
      const d = ctx.getImageData(0, 0, 1, 1).data;
      return [d[0], d[1], d[2]];
    };
    const cs = getComputedStyle(el);
    // Extract every color function from the focus box-shadow and normalize.
    const colors = (cs.boxShadow.match(/(rgba?|lab|oklab|oklch|hsla?|color)\([^)]+\)/g) ?? []).map(norm);
    return { borderColor: norm(cs.borderColor), shadowColors: colors, shadow: cs.boxShadow };
  });
  // slate-400 (v3: rgb(148,163,184); v4's oklch rounds within ±6) — a
  // blue-gray, decisively NOT cobalt rgb(46, 91, 255).
  const [r, g, b] = ring.borderColor;
  expect(Math.abs(r - 148)).toBeLessThanOrEqual(8);
  expect(Math.abs(g - 163)).toBeLessThanOrEqual(8);
  expect(Math.abs(b - 184)).toBeLessThanOrEqual(8);
  expect(b).toBeLessThan(200); // cobalt would read b=255
  // The ring rendered (not an all-transparent shadow) and carries no cobalt.
  expect(ring.shadow).not.toMatch(/0px 0px 0px 0px, 0px 0px 0px 0px, 0px 0px 0px 0px, 0px 0px 0px 0px, 0px 0px 0px 0px/);
  const flat = ring.shadowColors.flat();
  expect(flat.join(",")).not.toContain("46,91,255");
});

test("dashboard requires authentication", async ({ page }) => {
  await page.goto("/dashboard");
  await expect(page).toHaveURL(/\/login/);
});

test("valid credentials reach the dashboard", async ({ page }) => {
  test.skip(!PASSWORD, "E2E_ADMIN_PASSWORD not provided");
  await page.goto("/login");
  await page.getByRole("textbox", { name: "Email", exact: true }).fill(EMAIL);
  await page.getByRole("textbox", { name: "Password", exact: true }).fill(PASSWORD);
  await page.getByRole("button", { name: "Sign in" }).click();
  await expect(page).toHaveURL(/\/dashboard/, { timeout: 15_000 });
  await expect(page.getByRole("heading", { name: /Studio dashboard/i })).toBeVisible();
});

test("the radial menu opens, lists routes, and closes", async ({ page }) => {
  await page.goto("/");
  await page.getByRole("button", { name: "Open menu" }).click();
  const dialog = page.getByRole("dialog", { name: "Site navigation" });
  await expect(dialog).toBeVisible();
  // The wheel shows the four route labels plus a projects expander.
  await expect(dialog.getByRole("link", { name: "Home" })).toBeVisible();
  await expect(dialog.getByRole("link", { name: "About" })).toBeVisible();
  // Expand the projects submenu and follow one link.
  await dialog.getByRole("button", { name: "Toggle projects list" }).click();
  await expect(dialog.getByText("Kinto")).toBeVisible();
  await dialog.getByRole("link", { name: /^Kinto/ }).click();
  await expect(page).toHaveURL(new RegExp(`/project/${SLUG}`));
});

test("Escape closes the radial menu", async ({ page }) => {
  await page.goto("/");
  await page.getByRole("button", { name: "Open menu" }).click();
  const dialog = page.getByRole("dialog", { name: "Site navigation" });
  await expect(dialog).toBeVisible();
  await page.keyboard.press("Escape");
  await expect(dialog).toBeHidden({ timeout: 5_000 });
});

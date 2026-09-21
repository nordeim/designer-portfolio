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
});

test("invalid credentials are rejected without leaking internals", async ({ page }) => {
  await page.goto("/login");
  await page.getByRole("textbox", { name: "Email", exact: true }).fill("nobody@example.com");
  await page.getByRole("textbox", { name: "Password", exact: true }).fill("definitely-wrong-password");
  await page.getByRole("button", { name: "Sign in" }).click();
  await expect(page.getByRole("alert").filter({ hasText: /invalid email or password/i })).toBeVisible({ timeout: 10_000 });
  await expect(page).toHaveURL(/\/login/);
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

"use server";

import { db } from "@/lib/db";
import { verifyPassword } from "@/lib/auth/password";
import { createSession, destroySession, getCurrentUser, pruneExpiredSessions } from "@/lib/auth/session";
import {
  loginSchema,
  success,
  failure,
  zodFieldErrors,
  type ActionResult,
  type LoginInput,
} from "@/lib/validation";

/**
 * Auth server actions. Never throw across the action boundary — every path
 * returns an ActionResult envelope the client can render.
 */

// Rate-limit: in-memory sliding window keyed by email. 5 attempts / 10 min.
const attempts = new Map<string, number[]>();
const WINDOW_MS = 10 * 60 * 1000;
const MAX_ATTEMPTS = 5;

function throttle(email: string): boolean {
  const now = Date.now();
  const hits = (attempts.get(email) ?? []).filter((t) => now - t < WINDOW_MS);
  hits.push(now);
  attempts.set(email, hits);
  return hits.length > MAX_ATTEMPTS;
}

function clearThrottle(email: string): void {
  attempts.delete(email);
}

export async function loginAction(input: LoginInput): Promise<ActionResult<{ email: string }> | ActionResult<never>> {
  const parsed = loginSchema.safeParse(input);
  if (!parsed.success) {
    return failure("Please check the form for errors.", zodFieldErrors(parsed.error));
  }
  const { email, password } = parsed.data;
  const normalizedEmail = email.toLowerCase();

  if (throttle(normalizedEmail)) {
    return failure("Too many sign-in attempts. Please try again in a few minutes.");
  }

  // Infrastructure failures (e.g. a database outage) must not throw across
  // the action boundary — degrade to a generic, non-leaking message.
  let user;
  try {
    user = await db.user.findUnique({ where: { email: normalizedEmail } });
  } catch {
    return failure("Sign-in is temporarily unavailable. Please try again in a moment.");
  }
  if (!user) {
    return failure("Invalid email or password.");
  }

  const valid = await verifyPassword(password, user.passwordHash);
  if (!valid) {
    return failure("Invalid email or password.");
  }

  clearThrottle(normalizedEmail);
  try {
    await pruneExpiredSessions();
    await createSession(user.id);
  } catch {
    return failure("Sign-in is temporarily unavailable. Please try again in a moment.");
  }

  return success({ email: user.email });
}

export async function logoutAction(): Promise<ActionResult> {
  await destroySession();
  return success(undefined);
}

export async function currentUserAction() {
  return getCurrentUser();
}

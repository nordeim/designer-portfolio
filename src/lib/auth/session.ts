import { createHash, randomBytes, timingSafeEqual } from "node:crypto";
import { cookies } from "next/headers";
import { db } from "@/lib/db";

/**
 * Database-backed session management.
 *
 * - The cookie carries an opaque 32-byte token (HttpOnly, SameSite=Lax,
 *   Secure in production).
 * - Only the SHA-256 hash of the token is stored, so a database leak cannot
 *   be replayed as a valid session.
 * - Sessions expire after 30 days; `AUTH_SECRET` signs the cookie value so a
 *   forged cookie without a matching DB row is rejected anyway.
 */

export const SESSION_COOKIE = "dp_session";
const SESSION_TTL_DAYS = 30;

function hashToken(token: string): string {
  return createHash("sha256").update(token).digest("hex");
}

function cookieSignature(value: string): string {
  const secret = process.env.AUTH_SECRET ?? "";
  return createHash("sha256").update(`${value}.${secret}`).digest("hex").slice(0, 32);
}

export function signCookieValue(token: string): string {
  return `${token}.${cookieSignature(token)}`;
}

export function verifyCookieValue(signed: string): string | null {
  const idx = signed.lastIndexOf(".");
  if (idx <= 0) return null;
  const token = signed.slice(0, idx);
  const sig = signed.slice(idx + 1);
  const expected = cookieSignature(token);
  return sig.length === expected.length && timingSafeEqualStr(sig, expected) ? token : null;
}

function timingSafeEqualStr(a: string, b: string): boolean {
  const ba = Buffer.from(a);
  const bb = Buffer.from(b);
  return ba.length === bb.length && timingSafeEqual(ba, bb);
}

export interface SessionUser {
  id: string;
  email: string;
  name: string | null;
  role: string;
}

/** Create a session row and set the signed, HttpOnly session cookie. */
export async function createSession(userId: string): Promise<void> {
  const token = randomBytes(32).toString("base64url");
  const expiresAt = new Date(Date.now() + SESSION_TTL_DAYS * 24 * 60 * 60 * 1000);

  await db.session.create({
    data: { tokenHash: hashToken(token), userId, expiresAt },
  });

  const jar = await cookies();
  jar.set(SESSION_COOKIE, signCookieValue(token), {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    expires: expiresAt,
  });
}

/** Resolve the current user from the session cookie, or null. */
export async function getCurrentUser(): Promise<SessionUser | null> {
  const jar = await cookies();
  const signed = jar.get(SESSION_COOKIE)?.value;
  if (!signed) return null;

  const token = verifyCookieValue(signed);
  if (!token) return null;

  const session = await db.session.findFirst({
    where: { tokenHash: hashToken(token), expiresAt: { gt: new Date() } },
    include: { user: true },
  });
  if (!session) return null;

  return {
    id: session.user.id,
    email: session.user.email,
    name: session.user.name,
    role: session.user.role,
  };
}

/** Delete the current session row and clear the cookie. */
export async function destroySession(): Promise<void> {
  const jar = await cookies();
  const signed = jar.get(SESSION_COOKIE)?.value;
  if (signed) {
    const token = verifyCookieValue(signed);
    if (token) {
      await db.session.deleteMany({ where: { tokenHash: hashToken(token) } });
    }
  }
  jar.delete(SESSION_COOKIE);
}

/** Prune expired sessions — cheap enough to call opportunistically on login. */
export async function pruneExpiredSessions(): Promise<void> {
  await db.session.deleteMany({ where: { expiresAt: { lt: new Date() } } });
}

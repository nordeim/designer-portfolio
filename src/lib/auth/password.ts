import { randomBytes, scrypt as scryptCb, timingSafeEqual } from "node:crypto";
import { promisify } from "node:util";

const scrypt = promisify(scryptCb) as (
  password: string,
  salt: Buffer,
  keylen: number,
) => Promise<Buffer>;

const KEY_LENGTH = 64;

/**
 * Hash a password with scrypt (node:crypto, no native bindings).
 * Format: `scrypt$<saltHex>$<hashHex>` — self-describing and portable across
 * Node versions. We deliberately avoid native bcrypt/argon2 bindings so the
 * app installs and runs anywhere Node does.
 */
export async function hashPassword(password: string): Promise<string> {
  const salt = randomBytes(16);
  const derived = await scrypt(password, salt, KEY_LENGTH);
  return `scrypt$${salt.toString("hex")}$${derived.toString("hex")}`;
}

export async function verifyPassword(password: string, stored: string): Promise<boolean> {
  const parts = stored.split("$");
  if (parts.length !== 3 || parts[0] !== "scrypt") return false;
  const salt = Buffer.from(parts[1]!, "hex");
  const expected = Buffer.from(parts[2]!, "hex");
  const derived = await scrypt(password, salt, expected.length);
  // Constant-time comparison — no early-exit length oracle.
  return derived.length === expected.length && timingSafeEqual(derived, expected);
}

import * as argon2 from "argon2";
import bcrypt from "bcryptjs";
import { env } from "../config/env";

/**
 * Options for Argon2id hashing per OWASP & project security plan recommendations:
 * - type: argon2id
 * - memoryCost: 65536 KB (64 MB)
 * - timeCost: 3 iterations
 * - parallelism: 4 threads
 */
const ARGON2_OPTIONS: argon2.HashOptions = {
  type: argon2.argon2id,
  memoryCost: 65536,
  timeCost: 3,
  parallelism: 4,
};

/**
 * Hashes a plaintext password using Argon2id (default) or bcrypt depending on configuration.
 */
export async function hashPassword(plaintext: string): Promise<string> {
  if (env.HASH_ALGORITHM === "argon2id") {
    return argon2.hash(plaintext, { ...ARGON2_OPTIONS, raw: false });
  }
  // Fallback to bcrypt (work factor 12)
  const salt = await bcrypt.genSalt(12);
  return bcrypt.hash(plaintext, salt);
}

/**
 * Verifies a plaintext password against a stored hash.
 * Automatically detects whether the hash is Argon2id (starts with '$argon2')
 * or bcrypt (starts with '$2a$', '$2b$', '$2y$').
 */
export async function verifyPassword(
  hash: string,
  plaintext: string
): Promise<boolean> {
  if (!hash || !plaintext) {
    return false;
  }

  // Detect Argon2 hash format
  if (hash.startsWith("$argon2")) {
    try {
      return await argon2.verify(hash, plaintext);
    } catch {
      return false;
    }
  }

  // Detect bcrypt hash format
  if (hash.startsWith("$2a$") || hash.startsWith("$2b$") || hash.startsWith("$2y$")) {
    try {
      return await bcrypt.compare(plaintext, hash);
    } catch {
      return false;
    }
  }

  return false;
}

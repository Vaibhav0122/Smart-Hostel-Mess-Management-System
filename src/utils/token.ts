import crypto from "crypto";
import jwt, { SignOptions } from "jsonwebtoken";
import { env } from "../config/env";
import { UserRole, UserStatus } from "../constants/roles";
import { AppError } from "../errors/AppError";
import { HttpStatus } from "../constants/statusCodes";

export interface AccessTokenPayload {
  sub: string;
  email: string;
  role: UserRole;
  studentId?: string | null;
  status: UserStatus;
}

/**
 * Hashes an arbitrary token (refresh token, activation token) using SHA-256.
 * The stored hash ensures raw tokens cannot be recovered even if the database is leaked.
 */
export function hashToken(rawToken: string): string {
  return crypto.createHash("sha256").update(rawToken).digest("hex");
}

/**
 * Issues a short-lived signed JWT access token.
 */
export function generateAccessToken(payload: AccessTokenPayload): string {
  const options: SignOptions = {
    expiresIn: env.JWT_ACCESS_EXPIRES_IN as any,
  };

  return jwt.sign(payload, env.JWT_ACCESS_SECRET, options);
}

/**
 * Verifies an access token signature and claims.
 * Throws AppError with 401 if expired or invalid.
 */
export function verifyAccessToken(token: string): AccessTokenPayload {
  try {
    const decoded = jwt.verify(token, env.JWT_ACCESS_SECRET);
    return decoded as AccessTokenPayload;
  } catch (err: any) {
    if (err instanceof jwt.TokenExpiredError) {
      throw new AppError(
        HttpStatus.UNAUTHORIZED,
        "ACCESS_TOKEN_EXPIRED",
        "The access token has expired. Please refresh your session."
      );
    }
    throw new AppError(
      HttpStatus.UNAUTHORIZED,
      "INVALID_ACCESS_TOKEN",
      "The provided access token is malformed or invalid."
    );
  }
}

/**
 * Generates a high-entropy 64-character hexadecimal refresh token and its SHA-256 hash.
 */
export function generateRefreshToken(): {
  rawToken: string;
  tokenHash: string;
} {
  const rawToken = crypto.randomBytes(32).toString("hex");
  const tokenHash = hashToken(rawToken);
  return { rawToken, tokenHash };
}

/**
 * Generates a single-use account activation token with configurable expiry (default: 72 hours).
 */
export function generateActivationToken(
  ttlHours: number = env.ACTIVATION_TOKEN_TTL_HOURS
): {
  rawToken: string;
  tokenHash: string;
  expiresAt: Date;
} {
  const rawToken = crypto.randomBytes(32).toString("hex");
  const tokenHash = hashToken(rawToken);
  const expiresAt = new Date(Date.now() + ttlHours * 60 * 60 * 1000);

  return { rawToken, tokenHash, expiresAt };
}

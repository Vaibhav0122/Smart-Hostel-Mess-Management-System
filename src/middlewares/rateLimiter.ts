import { Request, Response, NextFunction } from "express";
import { env } from "../config/env";
import { AppError } from "../errors/AppError";
import { HttpStatus } from "../constants/statusCodes";

interface RateLimitRecord {
  count: number;
  resetTime: number;
}

const rateLimitStore = new Map<string, RateLimitRecord>();

/**
 * Resets the rate limiter store. Useful for unit and integration testing.
 */
export function resetRateLimits(): void {
  rateLimitStore.clear();
}

/**
 * Creates a rate limiting middleware based on client IP.
 */
export const createRateLimiter = (
  maxRequests: number = env.AUTH_RATE_LIMIT_MAX_REQUESTS,
  windowMs: number = env.RATE_LIMIT_WINDOW_MS
) => {
  return (req: Request, _res: Response, next: NextFunction): void => {
    // In test environment, allow bypassing unless specifically testing rate limits
    if (env.NODE_ENV === "test" && !req.headers["x-test-rate-limit"]) {
      return next();
    }

    const key = req.ip || req.socket.remoteAddress || "unknown_ip";
    const now = Date.now();

    const record = rateLimitStore.get(key);

    if (!record || now > record.resetTime) {
      rateLimitStore.set(key, {
        count: 1,
        resetTime: now + windowMs,
      });
      return next();
    }

    if (record.count >= maxRequests) {
      const retryAfterSeconds = Math.ceil((record.resetTime - now) / 1000);
      return next(
        new AppError(
          HttpStatus.TOO_MANY_REQUESTS,
          "TOO_MANY_REQUESTS",
          `Too many authentication attempts. Please try again in ${retryAfterSeconds} seconds.`
        )
      );
    }

    record.count += 1;
    next();
  };
};

export const authRateLimiter = createRateLimiter(
  env.AUTH_RATE_LIMIT_MAX_REQUESTS,
  env.RATE_LIMIT_WINDOW_MS
);

import { env } from "#config/env";

/**
 * Named throttler used by the global guard. A single global throttler keeps general API
 * abuse in check; sensitive routes tighten it per-handler via {@link AUTH_THROTTLE} /
 * {@link WRITE_THROTTLE}. NestJS applies every configured throttler to every route, so we
 * deliberately keep one named throttler and override its limits where needed rather than
 * registering extra global throttlers that would clamp unrelated endpoints.
 */
export const DEFAULT_THROTTLER_NAME = "default";

/** Tighter per-IP budget for public auth routes (brute-force protection). */
export const AUTH_THROTTLE = {
  [DEFAULT_THROTTLER_NAME]: {
    limit: env.RATE_LIMIT_AUTH_LIMIT,
    ttl: env.RATE_LIMIT_AUTH_WINDOW_MS,
  },
} as const;

/** Tighter per-user budget for expensive write/mutation routes (spam protection). */
export const WRITE_THROTTLE = {
  [DEFAULT_THROTTLER_NAME]: {
    limit: env.RATE_LIMIT_WRITE_LIMIT,
    ttl: env.RATE_LIMIT_WRITE_WINDOW_MS,
  },
} as const;

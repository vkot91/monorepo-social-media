import { Injectable, type OnModuleDestroy } from "@nestjs/common";
import Redis from "ioredis";

import { env } from "#config/env";

const wsRateLimitKey = (userId: string, event: string) => `ratelimit:ws:${userId}:${event}`;

export type WsRateLimitResult = {
  allowed: boolean;
  /** Seconds until the window resets. Only meaningful when `allowed` is false. */
  retryAfterSeconds: number;
};

/**
 * Fixed-window limiter for WebSocket events, backed by Redis so counters stay correct
 * across API nodes. Mirrors the INCR/EXPIRE pattern used by PresenceService. The first hit
 * in a window stamps the TTL; the key self-expires so buckets recover automatically.
 */
@Injectable()
export class WsRateLimitService implements OnModuleDestroy {
  private readonly redis = new Redis(env.REDIS_URL);

  async consume(userId: string, event: string, limit: number, windowMs: number): Promise<WsRateLimitResult> {
    const key = wsRateLimitKey(userId, event);
    const count = await this.redis.incr(key);

    if (count === 1) {
      await this.redis.pexpire(key, windowMs);
    }

    if (count > limit) {
      const ttlMs = await this.redis.pttl(key);

      return { allowed: false, retryAfterSeconds: Math.ceil(Math.max(ttlMs, 0) / 1000) };
    }

    return { allowed: true, retryAfterSeconds: 0 };
  }

  async onModuleDestroy(): Promise<void> {
    await this.redis.quit();
  }
}

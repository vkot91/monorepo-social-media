import { Injectable, type OnModuleDestroy } from "@nestjs/common";
import Redis from "ioredis";

import { env } from "#config/env";

const presenceKey = (userId: string) => `presence:${userId}`;

// A live socket re-stamps this TTL on connect and on the gateway's heartbeat sweep.
// If an SREM is ever missed (crashed node, ungraceful disconnect), the leaked member
// self-expires once no live socket keeps the key warm — so presence self-heals.
export const PRESENCE_TTL_SECONDS = 120;

@Injectable()
export class PresenceService implements OnModuleDestroy {
  private readonly redis = new Redis(env.REDIS_URL);

  /** Records a socket for the user. Returns true on an offline -> online transition. */
  async addConnection(userId: string, socketId: string): Promise<boolean> {
    const key = presenceKey(userId);
    const added = await this.redis.sadd(key, socketId);
    await this.redis.expire(key, PRESENCE_TTL_SECONDS);
    const size = await this.redis.scard(key);

    return added === 1 && size === 1;
  }

  /** Drops a socket for the user. Returns true on an online -> offline transition. */
  async removeConnection(userId: string, socketId: string): Promise<boolean> {
    const key = presenceKey(userId);
    const removed = await this.redis.srem(key, socketId);
    const size = await this.redis.scard(key);

    if (size === 0) {
      await this.redis.del(key);

      return removed === 1;
    }

    await this.redis.expire(key, PRESENCE_TTL_SECONDS);

    return false;
  }

  /** Keeps a still-connected socket's membership and TTL warm (heartbeat sweep). */
  async refresh(userId: string, socketId: string): Promise<void> {
    const key = presenceKey(userId);
    await this.redis.sadd(key, socketId);
    await this.redis.expire(key, PRESENCE_TTL_SECONDS);
  }

  async isOnline(userId: string): Promise<boolean> {
    return (await this.redis.scard(presenceKey(userId))) > 0;
  }

  async onModuleDestroy(): Promise<void> {
    await this.redis.quit();
  }
}

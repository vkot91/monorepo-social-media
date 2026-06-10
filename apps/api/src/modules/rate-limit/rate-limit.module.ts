import { ThrottlerStorageRedisService } from "@nest-lab/throttler-storage-redis";
import { Module } from "@nestjs/common";
import { APP_GUARD } from "@nestjs/core";
import { ThrottlerModule } from "@nestjs/throttler";

import { env } from "#config/env";

import { AppThrottlerGuard } from "./guards/app-throttler.guard";
import { DEFAULT_THROTTLER_NAME } from "./rate-limit.constants";
import { WsRateLimitService } from "./ws/ws-rate-limit.service";

@Module({
  imports: [
    // forRootAsync so the Redis-backed storage is created during DI init (and torn down on
    // app close) rather than at import time, which would open a socket just by importing the module.
    ThrottlerModule.forRootAsync({
      useFactory: () => ({
        errorMessage: "Too many requests. Please retry later.",
        storage: new ThrottlerStorageRedisService(env.REDIS_URL),
        throttlers: [
          {
            name: DEFAULT_THROTTLER_NAME,
            limit: env.RATE_LIMIT_DEFAULT_LIMIT,
            ttl: env.RATE_LIMIT_DEFAULT_WINDOW_MS,
          },
        ],
      }),
    }),
  ],
  providers: [
    WsRateLimitService,
    {
      provide: APP_GUARD,
      useClass: AppThrottlerGuard,
    },
  ],
  exports: [WsRateLimitService],
})
export class RateLimitModule {}

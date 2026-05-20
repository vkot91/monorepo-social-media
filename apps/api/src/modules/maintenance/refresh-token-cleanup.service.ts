import { Injectable, OnApplicationBootstrap } from "@nestjs/common";
import { Cron, CronExpression } from "@nestjs/schedule";
import { prisma } from "@social/database";

import { LoggingService } from "#common/logging/logging.service";

@Injectable()
export class RefreshTokenCleanupService implements OnApplicationBootstrap {
  constructor(private readonly loggingService: LoggingService) {}

  async onApplicationBootstrap() {
    await this.deleteStaleRefreshTokens();
  }

  @Cron(CronExpression.EVERY_HOUR, {
    name: "refresh-token-cleanup",
    unrefTimeout: true,
    waitForCompletion: true,
  })
  async handleCron() {
    await this.deleteStaleRefreshTokens();
  }

  async deleteStaleRefreshTokens(now = new Date()) {
    const result = await prisma.refreshToken.deleteMany({
      where: {
        OR: [
          {
            expiresAt: {
              lte: now,
            },
          },
          {
            revokedAt: {
              not: null,
            },
          },
        ],
      },
    });

    if (result.count > 0) {
      this.loggingService.log(RefreshTokenCleanupService.name, `Deleted ${result.count} stale refresh tokens`);
    }

    return result.count;
  }
}

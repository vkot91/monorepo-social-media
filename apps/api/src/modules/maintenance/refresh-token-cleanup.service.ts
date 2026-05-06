import { Injectable, Logger, OnApplicationBootstrap } from "@nestjs/common";
import { Cron, CronExpression } from "@nestjs/schedule";
import { prisma } from "@social/database";

@Injectable()
export class RefreshTokenCleanupService implements OnApplicationBootstrap {
  private readonly logger = new Logger(RefreshTokenCleanupService.name);

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
      this.logger.log(`Deleted ${result.count} stale refresh tokens`);
    }

    return result.count;
  }
}

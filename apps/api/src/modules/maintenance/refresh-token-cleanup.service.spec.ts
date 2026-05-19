import { Logger } from "@nestjs/common";

import { mockedPrisma } from "#test/prisma.mock";

import { RefreshTokenCleanupService } from "./refresh-token-cleanup.service";

describe("RefreshTokenCleanupService", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("deletes expired and revoked refresh tokens", async () => {
    const now = new Date("2026-05-05T12:00:00.000Z");

    mockedPrisma.refreshToken.deleteMany.mockResolvedValue({ count: 3 });
    jest.spyOn(Logger.prototype, "log").mockImplementation();

    const service = new RefreshTokenCleanupService();

    await expect(service.deleteStaleRefreshTokens(now)).resolves.toBe(3);
    expect(mockedPrisma.refreshToken.deleteMany).toHaveBeenCalledWith({
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
  });

  it("runs cleanup on application bootstrap and cron execution", async () => {
    mockedPrisma.refreshToken.deleteMany.mockResolvedValue({ count: 0 });

    const service = new RefreshTokenCleanupService();

    await service.onApplicationBootstrap();
    await service.handleCron();

    expect(mockedPrisma.refreshToken.deleteMany).toHaveBeenCalledTimes(2);
  });
});

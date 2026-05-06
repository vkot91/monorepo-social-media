import { Logger } from "@nestjs/common";
import { prisma } from "@social/database";

import { RefreshTokenCleanupService } from "./refresh-token-cleanup.service";

jest.mock("@social/database", () => ({
  prisma: {
    refreshToken: {
      deleteMany: jest.fn(),
    },
  },
}));

type MockedPrisma = {
  refreshToken: {
    deleteMany: jest.Mock;
  };
};

describe("RefreshTokenCleanupService", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("deletes expired and revoked refresh tokens", async () => {
    const mockedPrisma = prisma as unknown as MockedPrisma;
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
    const mockedPrisma = prisma as unknown as MockedPrisma;
    mockedPrisma.refreshToken.deleteMany.mockResolvedValue({ count: 0 });

    const service = new RefreshTokenCleanupService();

    await service.onApplicationBootstrap();
    await service.handleCron();

    expect(mockedPrisma.refreshToken.deleteMany).toHaveBeenCalledTimes(2);
  });
});

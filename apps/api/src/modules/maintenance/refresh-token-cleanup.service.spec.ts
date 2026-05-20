import { LoggingService } from "#common/logging/logging.service";
import { mockedPrisma } from "#test/prisma.mock";

import { RefreshTokenCleanupService } from "./refresh-token-cleanup.service";

const createLoggingService = () =>
  ({
    error: jest.fn(),
    log: jest.fn(),
    warn: jest.fn(),
  }) as unknown as jest.Mocked<LoggingService>;

describe("RefreshTokenCleanupService", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("deletes expired and revoked refresh tokens", async () => {
    const now = new Date("2026-05-05T12:00:00.000Z");

    mockedPrisma.refreshToken.deleteMany.mockResolvedValue({ count: 3 });
    const loggingService = createLoggingService();

    const service = new RefreshTokenCleanupService(loggingService);

    await expect(service.deleteStaleRefreshTokens(now)).resolves.toBe(3);
    expect(loggingService.log).toHaveBeenCalledWith(RefreshTokenCleanupService.name, "Deleted 3 stale refresh tokens");
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

    const service = new RefreshTokenCleanupService(createLoggingService());

    await service.onApplicationBootstrap();
    await service.handleCron();

    expect(mockedPrisma.refreshToken.deleteMany).toHaveBeenCalledTimes(2);
  });
});

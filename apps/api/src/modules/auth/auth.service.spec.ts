import { ConflictException, UnauthorizedException } from "@nestjs/common";

import { AuthService } from "./auth.service";

import {
  buildAuthUserRecord,
  buildRefreshPayload,
  buildStoredRefreshTokenRecord,
} from "#test/factories/auth.factory";
import { mockedPrisma } from "#test/prisma.mock";

jest.mock("../../config/env", () => ({
  getApiEnv: jest.fn(() => ({
    JWT_ACCESS_EXPIRES_IN: "15m",
    JWT_ACCESS_SECRET: "a".repeat(32),
    JWT_REFRESH_EXPIRES_IN: "30d",
    JWT_REFRESH_SECRET: "r".repeat(32),
  })),
}));

const persistedUser = buildAuthUserRecord();

function createService() {
  mockedPrisma.user.create.mockResolvedValue(persistedUser);
  mockedPrisma.refreshToken.updateMany.mockResolvedValue({ count: 1 });
  mockedPrisma.$transaction.mockResolvedValue([]);

  const jwtService = {
    signAsync: jest.fn(async (payload: { jti?: string; type: string }) =>
      payload.type === "access" ? "access-token" : `refresh-token:${payload.jti}`,
    ),
    verifyAsync: jest.fn(),
  };
  const hashService = {
    compare: jest.fn(),
    hash: jest.fn(async (value: string) => `hashed:${value}`),
  };
  const emailQueueService = {
    enqueueWelcomeEmail: jest.fn().mockResolvedValue(undefined),
  };

  return {
    emailQueueService,
    hashService,
    jwtService,
    prisma: mockedPrisma,
    service: new AuthService(jwtService as never, hashService as never, emailQueueService as never),
  };
}

describe("AuthService", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.useRealTimers();
  });

  it("registers a parsed user and stores only a hashed refresh token", async () => {
    jest.useFakeTimers().setSystemTime(new Date("2026-05-05T12:00:00.000Z"));
    const { emailQueueService, hashService, jwtService, prisma, service } = createService();

    const result = await service.register({
      displayName: "Ada Lovelace",
      email: "ada@example.com",
      password: "password123",
      username: "ada",
    });

    expect(prisma.user.create).toHaveBeenCalledWith({
      data: {
        displayName: "Ada Lovelace",
        email: "ada@example.com",
        passwordHash: "hashed:password123",
        username: "ada",
      },
      select: expect.any(Object),
    });
    expect(jwtService.signAsync).toHaveBeenCalledTimes(2);
    expect(hashService.hash).toHaveBeenCalledWith(expect.stringMatching(/^refresh-token:/));
    expect(prisma.refreshToken.create).toHaveBeenCalledWith({
      data: {
        expiresAt: new Date("2026-06-04T12:00:00.000Z"),
        id: expect.any(String),
        tokenHash: expect.stringMatching(/^hashed:refresh-token:/),
        userId: "user-1",
      },
    });
    expect(emailQueueService.enqueueWelcomeEmail).toHaveBeenCalledWith({
      displayName: "Ada Lovelace",
      email: "ada@example.com",
    });
    expect(result).toEqual({
      accessToken: "access-token",
      refreshToken: expect.stringMatching(/^refresh-token:/),
      user: {
        avatarUrl: null,
        bio: null,
        createdAt: "2026-05-05T10:00:00.000Z",
        displayName: "Ada Lovelace",
        email: "ada@example.com",
        id: "user-1",
        username: "ada",
      },
    });
  });

  it("maps unique user conflicts to a public conflict error", async () => {
    const { prisma, service } = createService();
    prisma.user.create.mockRejectedValue({ code: "P2002" });

    await expect(
      service.register({
        displayName: "Ada Lovelace",
        email: "ada@example.com",
        password: "password123",
        username: "ada",
      }),
    ).rejects.toBeInstanceOf(ConflictException);
  });

  it("rethrows unexpected registration errors", async () => {
    const { prisma, service } = createService();
    const error = new Error("database unavailable");
    prisma.user.create.mockRejectedValue(error);

    await expect(
      service.register({
        displayName: "Ada Lovelace",
        email: "ada@example.com",
        password: "password123",
        username: "ada",
      }),
    ).rejects.toBe(error);
  });

  it("rethrows non-unique Prisma registration errors", async () => {
    const { prisma, service } = createService();
    const error = { code: "P1001" };
    prisma.user.create.mockRejectedValue(error);

    await expect(
      service.register({
        displayName: "Ada Lovelace",
        email: "ada@example.com",
        password: "password123",
        username: "ada",
      }),
    ).rejects.toBe(error);
  });

  it("logs in with matching credentials", async () => {
    const { hashService, prisma, service } = createService();
    prisma.user.findUnique.mockResolvedValue(persistedUser);
    hashService.compare.mockResolvedValue(true);

    const result = await service.login({
      email: "ada@example.com",
      password: "password123",
    });

    expect(prisma.user.findUnique).toHaveBeenCalledWith({
      where: {
        email: "ada@example.com",
      },
    });
    expect(result).toMatchObject({
      accessToken: "access-token",
      user: {
        id: "user-1",
      },
    });
  });

  it("rejects login when credentials do not match", async () => {
    const { hashService, prisma, service } = createService();
    prisma.user.findUnique.mockResolvedValue(persistedUser);
    hashService.compare.mockResolvedValue(false);

    await expect(
      service.login({
        email: "ada@example.com",
        password: "wrong-password",
      }),
    ).rejects.toBeInstanceOf(UnauthorizedException);
  });

  it("rejects login when the user does not exist", async () => {
    const { hashService, prisma, service } = createService();
    prisma.user.findUnique.mockResolvedValue(null);

    await expect(
      service.login({
        email: "missing@example.com",
        password: "password123",
      }),
    ).rejects.toBeInstanceOf(UnauthorizedException);
    expect(hashService.compare).not.toHaveBeenCalled();
  });

  it("rotates refresh tokens", async () => {
    jest.useFakeTimers().setSystemTime(new Date("2026-05-05T12:00:00.000Z"));
    const { hashService, jwtService, prisma, service } = createService();
    jwtService.verifyAsync.mockResolvedValue(buildRefreshPayload());
    prisma.refreshToken.findUnique.mockResolvedValue(
      buildStoredRefreshTokenRecord({
        user: persistedUser,
      }),
    );
    hashService.compare.mockResolvedValue(true);

    const result = await service.refresh("old-refresh-token");

    expect(prisma.refreshToken.findUnique).toHaveBeenCalledWith({
      include: {
        user: {
          select: expect.any(Object),
        },
      },
      where: {
        id: "refresh-token-1",
      },
    });
    expect(prisma.$transaction).toHaveBeenCalledWith([
      expect.objectContaining({}),
      expect.objectContaining({}),
    ]);
    expect(prisma.refreshToken.update).toHaveBeenCalledWith({
      data: {
        revokedAt: new Date("2026-05-05T12:00:00.000Z"),
      },
      where: {
        id: "refresh-token-1",
      },
    });
    expect(prisma.refreshToken.create).toHaveBeenCalledWith({
      data: {
        expiresAt: new Date("2026-06-04T12:00:00.000Z"),
        id: expect.any(String),
        tokenHash: expect.stringMatching(/^hashed:refresh-token:/),
        userId: "user-1",
      },
    });
    expect(result).toEqual({
      accessToken: "access-token",
      refreshToken: expect.stringMatching(/^refresh-token:/),
    });
  });

  it("rejects revoked refresh tokens", async () => {
    const { jwtService, prisma, service } = createService();
    jwtService.verifyAsync.mockResolvedValue(buildRefreshPayload());
    prisma.refreshToken.findUnique.mockResolvedValue({
      ...buildStoredRefreshTokenRecord(),
      revokedAt: new Date("2026-05-05T12:00:00.000Z"),
    });

    await expect(service.refresh("old-refresh-token")).rejects.toBeInstanceOf(
      UnauthorizedException,
    );
  });

  it("rejects refresh tokens without a token id", async () => {
    const { jwtService, service } = createService();
    jwtService.verifyAsync.mockResolvedValue(buildRefreshPayload({ jti: undefined }));

    await expect(service.refresh("refresh-token")).rejects.toBeInstanceOf(UnauthorizedException);
  });

  it("rejects refresh tokens that are missing from storage", async () => {
    const { jwtService, prisma, service } = createService();
    jwtService.verifyAsync.mockResolvedValue(buildRefreshPayload());
    prisma.refreshToken.findUnique.mockResolvedValue(null);

    await expect(service.refresh("refresh-token")).rejects.toBeInstanceOf(UnauthorizedException);
  });

  it("rejects expired refresh tokens", async () => {
    const { jwtService, prisma, service } = createService();
    jest.useFakeTimers().setSystemTime(new Date("2026-05-05T12:00:00.000Z"));
    jwtService.verifyAsync.mockResolvedValue(buildRefreshPayload());
    prisma.refreshToken.findUnique.mockResolvedValue(
      buildStoredRefreshTokenRecord({
        expiresAt: new Date("2026-05-05T11:59:59.000Z"),
      }),
    );

    await expect(service.refresh("refresh-token")).rejects.toBeInstanceOf(UnauthorizedException);
  });

  it("rejects refresh tokens when the stored hash does not match", async () => {
    const { hashService, jwtService, prisma, service } = createService();
    jwtService.verifyAsync.mockResolvedValue(buildRefreshPayload());
    prisma.refreshToken.findUnique.mockResolvedValue(buildStoredRefreshTokenRecord());
    hashService.compare.mockResolvedValue(false);

    await expect(service.refresh("refresh-token")).rejects.toBeInstanceOf(UnauthorizedException);
  });

  it("rejects non-refresh JWTs in refresh-only flows", async () => {
    const { jwtService, service } = createService();
    jwtService.verifyAsync.mockResolvedValue(
      buildRefreshPayload({
        jti: "token-1",
        type: "access",
      }),
    );

    await expect(service.refresh("access-token")).rejects.toBeInstanceOf(UnauthorizedException);
  });

  it("rejects refresh tokens that fail JWT verification", async () => {
    const { jwtService, service } = createService();
    jwtService.verifyAsync.mockRejectedValue(new Error("invalid signature"));

    await expect(service.refresh("bad-token")).rejects.toBeInstanceOf(UnauthorizedException);
  });

  it("revokes a refresh token on logout", async () => {
    const { jwtService, prisma, service } = createService();
    jwtService.verifyAsync.mockResolvedValue(buildRefreshPayload());

    await service.logout("refresh-token");

    expect(prisma.refreshToken.updateMany).toHaveBeenCalledWith({
      data: {
        revokedAt: expect.any(Date),
      },
      where: {
        id: "refresh-token-1",
        revokedAt: null,
      },
    });
  });

  it("does nothing on logout when the token has no id", async () => {
    const { jwtService, prisma, service } = createService();
    jwtService.verifyAsync.mockResolvedValue(buildRefreshPayload({ jti: undefined }));

    await service.logout("refresh-token");

    expect(prisma.refreshToken.updateMany).not.toHaveBeenCalled();
  });
});

import { type ExecutionContext,UnauthorizedException } from "@nestjs/common";

import { RefreshTokenGuard } from "./refresh-token.guard";

jest.mock("#config/env", () => ({
  getApiEnv: jest.fn(() => ({
    JWT_ACCESS_SECRET: "a".repeat(32),
    JWT_REFRESH_SECRET: "r".repeat(32),
  })),
}));

function createContext(request: Record<string, unknown>) {
  return {
    switchToHttp: jest.fn(() => ({
      getRequest: jest.fn(() => request),
    })),
  } as unknown as ExecutionContext;
}

describe("RefreshTokenGuard", () => {
  function createGuard() {
    const jwtService = {
      verifyAsync: jest.fn(),
    };

    return {
      guard: new RefreshTokenGuard(jwtService as never),
      jwtService,
    };
  }

  it("allows requests with a valid refresh token body and attaches the payload", async () => {
    const { guard, jwtService } = createGuard();
    const request = {
      body: {
        refreshToken: "refresh-token",
      },
    };
    const payload = {
      email: "ada@example.com",
      jti: "refresh-token-1",
      sub: "user-1",
      type: "refresh",
      username: "ada",
    };
    jwtService.verifyAsync.mockResolvedValue(payload);

    await expect(guard.canActivate(createContext(request))).resolves.toBe(true);

    expect(jwtService.verifyAsync).toHaveBeenCalledWith("refresh-token", {
      secret: "r".repeat(32),
    });
    expect(request).toHaveProperty("user", payload);
  });

  it("rejects requests without a refresh token body", async () => {
    const { guard, jwtService } = createGuard();

    await expect(
      guard.canActivate(
        createContext({
          body: {},
        }),
      ),
    ).rejects.toBeInstanceOf(UnauthorizedException);
    expect(jwtService.verifyAsync).not.toHaveBeenCalled();
  });

  it("rejects access tokens in refresh-only routes", async () => {
    const { guard, jwtService } = createGuard();
    jwtService.verifyAsync.mockResolvedValue({
      sub: "user-1",
      type: "access",
    });

    await expect(
      guard.canActivate(
        createContext({
          body: {
            refreshToken: "access-token",
          },
        }),
      ),
    ).rejects.toBeInstanceOf(UnauthorizedException);
  });

  it("rejects tokens that fail JWT verification", async () => {
    const { guard, jwtService } = createGuard();
    jwtService.verifyAsync.mockRejectedValue(new Error("invalid signature"));

    await expect(
      guard.canActivate(
        createContext({
          body: {
            refreshToken: "bad-token",
          },
        }),
      ),
    ).rejects.toBeInstanceOf(UnauthorizedException);
  });
});

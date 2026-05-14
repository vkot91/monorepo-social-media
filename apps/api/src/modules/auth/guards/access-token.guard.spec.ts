import { type ExecutionContext,UnauthorizedException } from "@nestjs/common";
import type { Reflector } from "@nestjs/core";

import { AUTH_ROUTE_TYPE_METADATA_KEY } from "../decorators/auth-route-type.decorator";
import { AccessTokenGuard } from "./access-token.guard";

jest.mock("#config/env", () => ({
  getApiEnv: jest.fn(() => ({
    JWT_ACCESS_SECRET: "a".repeat(32),
    JWT_REFRESH_SECRET: "r".repeat(32),
  })),
}));

function createContext(request: Record<string, unknown>) {
  return {
    getClass: jest.fn(() => class TestController {}),
    getHandler: jest.fn(() => function testHandler() {}),
    switchToHttp: jest.fn(() => ({
      getRequest: jest.fn(() => request),
    })),
  } as unknown as ExecutionContext;
}

describe("AccessTokenGuard", () => {
  function createGuard() {
    const jwtService = {
      verifyAsync: jest.fn(),
    };
    const reflector = {
      getAllAndOverride: jest.fn(),
    };

    return {
      guard: new AccessTokenGuard(jwtService as never, reflector as unknown as Reflector),
      jwtService,
      reflector,
    };
  }

  it("allows requests with a valid access bearer token and attaches the payload", async () => {
    const { guard, jwtService } = createGuard();
    const request = {
      headers: {
        authorization: "Bearer access-token",
      },
    };
    const payload = {
      email: "ada@example.com",
      sub: "user-1",
      type: "access",
      username: "ada",
    };
    jwtService.verifyAsync.mockResolvedValue(payload);

    await expect(guard.canActivate(createContext(request))).resolves.toBe(true);

    expect(jwtService.verifyAsync).toHaveBeenCalledWith("access-token", {
      secret: "a".repeat(32),
    });
    expect(request).toHaveProperty("user", payload);
  });

  it("skips public routes", async () => {
    const { guard, jwtService, reflector } = createGuard();
    reflector.getAllAndOverride.mockReturnValue("public");

    await expect(
      guard.canActivate(
        createContext({
          headers: {},
        }),
      ),
    ).resolves.toBe(true);

    expect(reflector.getAllAndOverride).toHaveBeenCalledWith(AUTH_ROUTE_TYPE_METADATA_KEY, [
      expect.any(Function),
      expect.any(Function),
    ]);
    expect(jwtService.verifyAsync).not.toHaveBeenCalled();
  });

  it("skips routes that are protected by the refresh token guard", async () => {
    const { guard, jwtService, reflector } = createGuard();
    reflector.getAllAndOverride.mockReturnValue("refresh");

    await expect(
      guard.canActivate(
        createContext({
          headers: {},
        }),
      ),
    ).resolves.toBe(true);

    expect(jwtService.verifyAsync).not.toHaveBeenCalled();
  });

  it("rejects requests without a bearer token", async () => {
    const { guard, jwtService } = createGuard();

    await expect(
      guard.canActivate(
        createContext({
          headers: {},
        }),
      ),
    ).rejects.toBeInstanceOf(UnauthorizedException);
    expect(jwtService.verifyAsync).not.toHaveBeenCalled();
  });

  it("rejects refresh tokens in access-only routes", async () => {
    const { guard, jwtService } = createGuard();
    jwtService.verifyAsync.mockResolvedValue({
      jti: "refresh-token-1",
      sub: "user-1",
      type: "refresh",
    });

    await expect(
      guard.canActivate(
        createContext({
          headers: {
            authorization: "Bearer refresh-token",
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
          headers: {
            authorization: "Bearer bad-token",
          },
        }),
      ),
    ).rejects.toBeInstanceOf(UnauthorizedException);
  });
});

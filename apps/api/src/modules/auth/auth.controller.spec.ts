import { AuthController } from "./auth.controller";
import type { AuthService } from "./auth.service";
import { AUTH_ROUTE_TYPE_METADATA_KEY } from "./decorators/auth-route-type.decorator";
import { RefreshTokenGuard } from "./guards/refresh-token.guard";

describe("AuthController", () => {
  const authService = {
    login: jest.fn(),
    logout: jest.fn(),
    refresh: jest.fn(),
    register: jest.fn(),
  } as unknown as jest.Mocked<AuthService>;

  const controller = new AuthController(authService);

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("marks register and login as public routes", () => {
    expect(Reflect.getMetadata(AUTH_ROUTE_TYPE_METADATA_KEY, controller.register)).toBe("public");
    expect(Reflect.getMetadata(AUTH_ROUTE_TYPE_METADATA_KEY, controller.login)).toBe("public");
  });

  it("protects refresh and logout routes with refresh token auth", () => {
    expect(Reflect.getMetadata(AUTH_ROUTE_TYPE_METADATA_KEY, controller.refresh)).toBe("refresh");
    expect(Reflect.getMetadata(AUTH_ROUTE_TYPE_METADATA_KEY, controller.logout)).toBe("refresh");

    expect(Reflect.getMetadata("__guards__", controller.refresh)).toContain(RefreshTokenGuard);
    expect(Reflect.getMetadata("__guards__", controller.logout)).toContain(RefreshTokenGuard);
  });

  it("delegates registration", async () => {
    const dto = {
      displayName: "Ada Lovelace",
      email: "ada@example.com",
      password: "password123",
      username: "ada",
    };

    await controller.register(dto);

    expect(authService.register).toHaveBeenCalledWith(dto);
  });

  it("delegates login", async () => {
    const dto = {
      email: "ada@example.com",
      password: "password123",
    };

    await controller.login(dto);

    expect(authService.login).toHaveBeenCalledWith(dto);
  });

  it("delegates refresh with the raw token", async () => {
    await controller.refresh({ refreshToken: "refresh-token" });

    expect(authService.refresh).toHaveBeenCalledWith("refresh-token");
  });

  it("delegates logout with the raw token", async () => {
    await controller.logout({ refreshToken: "refresh-token" });

    expect(authService.logout).toHaveBeenCalledWith("refresh-token");
  });
});

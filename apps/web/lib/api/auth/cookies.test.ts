import { beforeEach, describe, expect, it, vi } from "vitest";
import {
  accessTokenCookieName,
  clearAuthCookies,
  getAccessToken,
  getRefreshToken,
  refreshTokenCookieName,
  setAuthCookies,
} from "./cookies";
import { cookies } from "next/headers";

vi.mock("next/headers", () => ({
  cookies: vi.fn(),
}));

const cookieStore = {
  delete: vi.fn(),
  get: vi.fn(),
  set: vi.fn(),
};

describe("auth cookies", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(cookies).mockResolvedValue(
      cookieStore as unknown as Awaited<ReturnType<typeof cookies>>,
    );
  });

  it("sets access and refresh token cookies with auth-only options", async () => {
    await setAuthCookies({
      accessToken: "access-token",
      refreshToken: "refresh-token",
    });

    expect(cookieStore.set).toHaveBeenCalledWith(accessTokenCookieName, "access-token", {
      httpOnly: true,
      maxAge: 60 * 15,
      path: "/",
      sameSite: "lax",
      secure: false,
    });
    expect(cookieStore.set).toHaveBeenCalledWith(refreshTokenCookieName, "refresh-token", {
      httpOnly: true,
      maxAge: 60 * 60 * 24 * 30,
      path: "/",
      sameSite: "lax",
      secure: false,
    });
  });

  it("clears both auth cookies", async () => {
    await clearAuthCookies();

    expect(cookieStore.delete).toHaveBeenCalledWith(accessTokenCookieName);
    expect(cookieStore.delete).toHaveBeenCalledWith(refreshTokenCookieName);
  });

  it("reads token cookies and returns null when absent", async () => {
    cookieStore.get.mockImplementation((name: string) => {
      if (name === accessTokenCookieName) {
        return { value: "access-token" };
      }

      return undefined;
    });

    await expect(getAccessToken()).resolves.toBe("access-token");
    await expect(getRefreshToken()).resolves.toBeNull();
  });

  it("reads refresh token cookies and returns null when the access token is absent", async () => {
    cookieStore.get.mockImplementation((name: string) => {
      if (name === refreshTokenCookieName) {
        return { value: "refresh-token" };
      }

      return undefined;
    });

    await expect(getAccessToken()).resolves.toBeNull();
    await expect(getRefreshToken()).resolves.toBe("refresh-token");
  });
});

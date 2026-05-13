import { beforeEach, describe, expect, it, vi } from "vitest";
import { authServerApi } from "#/lib/api/auth/server-actions";
import { clearAuthCookies, getRefreshToken } from "#/lib/api/auth/cookies";
import { POST } from "./route";

vi.mock("#/lib/api/auth/server-actions", () => ({
  authServerApi: {
    logout: vi.fn(),
  },
}));

vi.mock("#/lib/api/auth/cookies", () => ({
  clearAuthCookies: vi.fn(),
  getRefreshToken: vi.fn(),
}));

describe("POST /api/auth/logout", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(authServerApi.logout).mockResolvedValue(null);
  });

  it("logs out with the backend refresh token and clears cookies", async () => {
    vi.mocked(getRefreshToken).mockResolvedValueOnce("refresh-token");

    const response = await POST();

    expect(authServerApi.logout).toHaveBeenCalledWith({ refreshToken: "refresh-token" });
    expect(clearAuthCookies).toHaveBeenCalled();
    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toEqual({ ok: true });
  });

  it("clears cookies when no refresh token exists", async () => {
    vi.mocked(getRefreshToken).mockResolvedValueOnce(null);

    const response = await POST();

    expect(authServerApi.logout).not.toHaveBeenCalled();
    expect(clearAuthCookies).toHaveBeenCalled();
    await expect(response.json()).resolves.toEqual({ ok: true });
  });

  it("still clears cookies when backend logout fails", async () => {
    vi.mocked(getRefreshToken).mockResolvedValueOnce("refresh-token");
    vi.mocked(authServerApi.logout).mockRejectedValueOnce(new Error("network unavailable"));

    const response = await POST();

    expect(clearAuthCookies).toHaveBeenCalled();
    await expect(response.json()).resolves.toEqual({ ok: true });
  });
});

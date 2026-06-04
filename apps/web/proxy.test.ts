import { NextRequest } from "next/server";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { proxy } from "./proxy";
import { backendClient } from "./shared/lib/api/api-client/backend-client";
import { accessTokenCookieName, refreshTokenCookieName } from "./shared/lib/api/auth/cookies";

vi.mock("./shared/lib/api/api-client/backend-client", () => ({
  backendClient: vi.fn(),
}));

const createJwt = (payload: Record<string, unknown>) =>
  ["header", Buffer.from(JSON.stringify(payload), "utf8").toString("base64url"), "signature"].join(".");

const futureExp = () => Math.floor(Date.now() / 1000) + 3600;

const createRequest = (pathname: string, cookies: Record<string, string> = {}) => {
  const cookieHeader = Object.entries(cookies)
    .map(([k, v]) => `${k}=${v}`)
    .join("; ");

  return new NextRequest(`http://localhost${pathname}`, {
    headers: cookieHeader ? { cookie: cookieHeader } : {},
  });
};

const withExpiredSession = (pathname: string) =>
  createRequest(pathname, {
    [accessTokenCookieName]: createJwt({ exp: 0 }),
    [refreshTokenCookieName]: "refresh-token",
  });

describe("proxy", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("no refresh token", () => {
    it("allows access to auth pages without a session", async () => {
      const response = await proxy(createRequest("/login"));

      expect(response.status).toBe(200);
      expect(backendClient).not.toHaveBeenCalled();
    });

    it("redirects protected pages to login when there is no session", async () => {
      const response = await proxy(createRequest("/feed"));

      expect(response.status).toBe(307);
      expect(response.headers.get("location")).toBe("http://localhost/login?next=%2Ffeed");
      expect(backendClient).not.toHaveBeenCalled();
    });
  });

  describe("valid unexpired access token", () => {
    it("allows access to protected pages when the token is fresh", async () => {
      const request = createRequest("/feed", {
        [accessTokenCookieName]: createJwt({ exp: futureExp() }),
        [refreshTokenCookieName]: "refresh-token",
      });

      const response = await proxy(request);

      expect(response.status).toBe(200);
      expect(backendClient).not.toHaveBeenCalled();
    });

    it("redirects authenticated users away from auth pages", async () => {
      const request = createRequest("/login", {
        [accessTokenCookieName]: createJwt({ exp: futureExp() }),
        [refreshTokenCookieName]: "refresh-token",
      });

      const response = await proxy(request);

      expect(response.status).toBe(307);
      expect(response.headers.get("location")).toBe("http://localhost/feed");
      expect(backendClient).not.toHaveBeenCalled();
    });
  });

  describe("isJwtExpired edge cases (treated as expired → triggers refresh)", () => {
    it("treats a token with no payload segment as expired", async () => {
      vi.mocked(backendClient).mockRejectedValueOnce(new TypeError("fetch failed"));

      const request = createRequest("/feed", {
        [accessTokenCookieName]: "header-only-no-dots",
        [refreshTokenCookieName]: "refresh-token",
      });

      const response = await proxy(request);

      expect(response.status).toBe(307);
      expect(backendClient).toHaveBeenCalled();
    });

    it("treats a token whose exp claim is not a number as expired", async () => {
      vi.mocked(backendClient).mockRejectedValueOnce(new TypeError("fetch failed"));

      const request = createRequest("/feed", {
        [accessTokenCookieName]: createJwt({ exp: "not-a-number" }),
        [refreshTokenCookieName]: "refresh-token",
      });

      const response = await proxy(request);

      expect(response.status).toBe(307);
      expect(backendClient).toHaveBeenCalled();
    });

    it("treats a token with an undecodable payload as expired", async () => {
      vi.mocked(backendClient).mockRejectedValueOnce(new TypeError("fetch failed"));

      const request = createRequest("/feed", {
        [accessTokenCookieName]: "header.!!!invalid-base64!!$.signature",
        [refreshTokenCookieName]: "refresh-token",
      });

      const response = await proxy(request);

      expect(response.status).toBe(307);
      expect(backendClient).toHaveBeenCalled();
    });
  });

  describe("token refresh", () => {
    it("redirects protected pages to login when session refresh fails", async () => {
      vi.mocked(backendClient).mockRejectedValueOnce(new TypeError("fetch failed"));

      const response = await proxy(withExpiredSession("/feed"));

      expect(response.status).toBe(307);
      expect(response.headers.get("location")).toBe("http://localhost/login?next=%2Ffeed");
      expect(backendClient).toHaveBeenCalledWith("/auth/refresh", "POST", {
        auth: false,
        body: { refreshToken: "refresh-token" },
      });
    });

    it("allows access to auth pages when session refresh fails", async () => {
      vi.mocked(backendClient).mockRejectedValueOnce(new TypeError("fetch failed"));

      const response = await proxy(withExpiredSession("/login"));

      expect(response.status).toBe(200);
    });

    it("redirects protected pages to login when refresh returns no accessToken", async () => {
      vi.mocked(backendClient).mockResolvedValueOnce({});

      const response = await proxy(withExpiredSession("/feed"));

      expect(response.status).toBe(307);
      expect(response.headers.get("location")).toBe("http://localhost/login?next=%2Ffeed");
    });

    it("allows access to auth pages when refresh returns no accessToken", async () => {
      vi.mocked(backendClient).mockResolvedValueOnce({});

      const response = await proxy(withExpiredSession("/login"));

      expect(response.status).toBe(200);
    });

    it("sets refreshed tokens and continues to the protected page", async () => {
      vi.mocked(backendClient).mockResolvedValueOnce({
        accessToken: "new-access-token",
        refreshToken: "new-refresh-token",
      });

      const response = await proxy(withExpiredSession("/feed"));

      expect(response.status).toBe(200);
      const setCookies = response.headers.getSetCookie();
      expect(setCookies.some((c) => c.includes("new-access-token"))).toBe(true);
      expect(setCookies.some((c) => c.includes("new-refresh-token"))).toBe(true);
    });

    it("sets refreshed tokens and redirects authenticated users away from auth pages", async () => {
      vi.mocked(backendClient).mockResolvedValueOnce({
        accessToken: "new-access-token",
        refreshToken: "new-refresh-token",
      });

      const response = await proxy(withExpiredSession("/login"));

      expect(response.status).toBe(307);
      expect(response.headers.get("location")).toBe("http://localhost/feed");
      const setCookies = response.headers.getSetCookie();
      expect(setCookies.some((c) => c.includes("new-access-token"))).toBe(true);
    });
  });
});

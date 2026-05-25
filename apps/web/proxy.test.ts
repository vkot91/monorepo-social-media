import { NextRequest } from "next/server";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { backendClient } from "./lib/api/api-client/backend-client";
import { accessTokenCookieName, refreshTokenCookieName } from "./lib/api/auth/cookies";
import { proxy } from "./proxy";

vi.mock("./lib/api/api-client/backend-client", () => ({
  backendClient: vi.fn(),
}));

const createJwt = (payload: Record<string, unknown>) =>
  ["header", Buffer.from(JSON.stringify(payload), "utf8").toString("base64url"), "signature"].join(".");

const createRequest = (pathname: string) =>
  new NextRequest(`http://localhost${pathname}`, {
    headers: {
      cookie: [
        `${accessTokenCookieName}=${createJwt({ exp: 0 })}`,
        `${refreshTokenCookieName}=refresh-token`,
      ].join("; "),
    },
  });

describe("proxy", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("redirects protected pages to login when session refresh fails", async () => {
    vi.mocked(backendClient).mockRejectedValueOnce(new TypeError("fetch failed"));

    const response = await proxy(createRequest("/feed"));

    expect(response.status).toBe(307);
    expect(response.headers.get("location")).toBe("http://localhost/login?next=%2Ffeed");
    expect(backendClient).toHaveBeenCalledWith("/auth/refresh", "POST", {
      auth: false,
      body: {
        refreshToken: "refresh-token",
      },
    });
  });
});

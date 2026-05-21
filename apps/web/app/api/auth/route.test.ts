import type { AuthResponse, AuthUserDto } from "@social/contracts";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { backendClient } from "#/lib/api/api-client/backend-client";
import { clearAuthCookies, getRefreshToken } from "#/lib/api/auth/cookies";
import { persistAuthSession } from "#/lib/api/auth/session";
import { AuthRequiredError } from "#/lib/api/utils/errors";

import { POST as loginPost } from "./login/route";
import { POST as logoutPost } from "./logout/route";
import { GET as meGet } from "./me/route";
import { POST as refreshPost } from "./refresh/route";
import { POST as registerPost } from "./register/route";

vi.mock("#/lib/api/api-client/backend-client", () => ({
  backendClient: vi.fn(),
}));

vi.mock("#/lib/api/auth/cookies", () => ({
  clearAuthCookies: vi.fn(),
  getRefreshToken: vi.fn(),
}));

vi.mock("#/lib/api/auth/session", () => ({
  persistAuthSession: vi.fn(),
}));

const authResponse: AuthResponse = {
  accessToken: "access-token",
  refreshToken: "refresh-token",
};

const authUser: AuthUserDto = {
  avatarUrl: null,
  bio: null,
  createdAt: "2026-05-07T10:00:00.000Z",
  displayName: "Maya Johnson",
  email: "maya@example.com",
  id: "user-1",
  username: "maya",
};

const jsonRequest = (url: string, body: unknown) =>
  new Request(url, {
    body: JSON.stringify(body),
    headers: {
      "content-type": "application/json",
    },
    method: "POST",
  });

describe("auth BFF routes", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("logs in through the backend and persists httpOnly cookies", async () => {
    vi.mocked(backendClient).mockResolvedValueOnce(authResponse);

    const response = await loginPost(
      jsonRequest("http://localhost/api/auth/login", {
        email: " Maya@Example.com ",
        password: "password123",
      }),
    );

    await expect(response.json()).resolves.toBeNull();
    expect(response.status).toBe(200);
    expect(backendClient).toHaveBeenCalledWith("/auth/login", "POST", {
      auth: false,
      body: {
        email: "maya@example.com",
        password: "password123",
      },
    });
    expect(persistAuthSession).toHaveBeenCalledWith(authResponse);
  });

  it("returns login validation errors before calling the backend", async () => {
    const response = await loginPost(
      jsonRequest("http://localhost/api/auth/login", {
        email: "not-an-email",
        password: "short",
      }),
    );

    await expect(response.json()).resolves.toMatchObject({
      errors: {
        email: expect.any(Array),
        password: expect.any(Array),
      },
      message: "Enter a valid email and password.",
    });
    expect(response.status).toBe(400);
    expect(backendClient).not.toHaveBeenCalled();
  });

  it("registers through the backend and persists httpOnly cookies", async () => {
    vi.mocked(backendClient).mockResolvedValueOnce(authResponse);

    const response = await registerPost(
      jsonRequest("http://localhost/api/auth/register", {
        displayName: " Maya Johnson ",
        email: " Maya@Example.com ",
        password: "password123",
        username: " Maya_01 ",
      }),
    );

    await expect(response.json()).resolves.toBeNull();
    expect(response.status).toBe(200);
    expect(backendClient).toHaveBeenCalledWith("/auth/register", "POST", {
      auth: false,
      body: {
        displayName: "Maya Johnson",
        email: "maya@example.com",
        password: "password123",
        username: "maya_01",
      },
    });
    expect(persistAuthSession).toHaveBeenCalledWith(authResponse);
  });

  it("logs out through the backend when a refresh token exists", async () => {
    vi.mocked(getRefreshToken).mockResolvedValueOnce("refresh-token");
    vi.mocked(backendClient).mockResolvedValueOnce(null);

    const response = await logoutPost();

    await expect(response.json()).resolves.toBeNull();
    expect(response.status).toBe(200);
    expect(backendClient).toHaveBeenCalledWith("/auth/logout", "POST", {
      body: {
        refreshToken: "refresh-token",
      },
    });
    expect(clearAuthCookies).toHaveBeenCalled();
  });

  it("clears cookies on logout when no refresh token exists", async () => {
    vi.mocked(getRefreshToken).mockResolvedValueOnce(null);

    const response = await logoutPost();

    await expect(response.json()).resolves.toBeNull();
    expect(response.status).toBe(200);
    expect(backendClient).not.toHaveBeenCalled();
    expect(clearAuthCookies).toHaveBeenCalled();
  });

  it("refreshes the session using the refresh token cookie", async () => {
    vi.mocked(getRefreshToken).mockResolvedValueOnce("refresh-token");
    vi.mocked(backendClient).mockResolvedValueOnce(authResponse);

    const response = await refreshPost();

    await expect(response.json()).resolves.toBeNull();
    expect(response.status).toBe(200);
    expect(backendClient).toHaveBeenCalledWith("/auth/refresh", "POST", {
      auth: false,
      body: {
        refreshToken: "refresh-token",
      },
    });
    expect(persistAuthSession).toHaveBeenCalledWith(authResponse);
  });

  it("returns 401 when refresh has no refresh token cookie", async () => {
    vi.mocked(getRefreshToken).mockResolvedValueOnce(null);

    const response = await refreshPost();

    await expect(response.json()).resolves.toMatchObject({
      message: "Authentication is required",
    });
    expect(response.status).toBe(401);
    expect(backendClient).not.toHaveBeenCalled();
  });

  it("returns the current user through the BFF", async () => {
    vi.mocked(backendClient).mockResolvedValueOnce(authUser);

    const response = await meGet();

    await expect(response.json()).resolves.toEqual(authUser);
    expect(response.status).toBe(200);
    expect(backendClient).toHaveBeenCalledWith("/auth/me", "GET", {});
  });

  it("maps current-user auth failures to 401", async () => {
    vi.mocked(backendClient).mockRejectedValueOnce(new AuthRequiredError());

    const response = await meGet();

    await expect(response.json()).resolves.toMatchObject({
      message: "Authentication is required",
    });
    expect(response.status).toBe(401);
  });
});

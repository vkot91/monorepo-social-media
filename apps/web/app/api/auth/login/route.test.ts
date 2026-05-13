import { beforeEach, describe, expect, it, vi } from "vitest";
import type { AuthResponse } from "@social/contracts";
import { authServerApi } from "#/lib/api/auth/server-actions";
import { ApiRequestError } from "#/lib/api/errors";
import { persistAuthSession } from "#/lib/api/auth/session";
import { POST } from "./route";

vi.mock("#/lib/api/auth/server-actions", () => ({
  authServerApi: {
    login: vi.fn(),
  },
}));

vi.mock("#/lib/api/auth/session", () => ({
  persistAuthSession: vi.fn(),
}));

const authResponse: AuthResponse = {
  accessToken: "access-token",
  refreshToken: "refresh-token",
  user: {
    avatarUrl: null,
    bio: null,
    createdAt: "2026-05-07T10:00:00.000Z",
    displayName: "Maya Johnson",
    email: "maya@example.com",
    id: "user-1",
    username: "maya",
  },
};

const createRequest = (body: unknown) =>
  new Request("http://localhost/api/auth/login", {
    body: JSON.stringify(body),
    method: "POST",
  });

describe("POST /api/auth/login", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("rejects invalid input", async () => {
    const response = await POST(createRequest({ email: "bad", password: "short" }));

    expect(response.status).toBe(400);
    await expect(response.json()).resolves.toEqual({
      message: "Enter a valid email and password.",
    });
    expect(authServerApi.login).not.toHaveBeenCalled();
  });

  it("persists the auth session and returns the user", async () => {
    vi.mocked(authServerApi.login).mockResolvedValueOnce(authResponse);

    const response = await POST(
      createRequest({
        email: "maya@example.com",
        password: "password123",
      }),
    );

    expect(authServerApi.login).toHaveBeenCalledWith({
      email: "maya@example.com",
      password: "password123",
    });
    expect(persistAuthSession).toHaveBeenCalledWith(authResponse);
    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toEqual({ user: authResponse.user });
  });

  it("passes backend API errors through", async () => {
    vi.mocked(authServerApi.login).mockRejectedValueOnce(
      new ApiRequestError("Invalid credentials", 401),
    );

    const response = await POST(
      createRequest({
        email: "maya@example.com",
        password: "password123",
      }),
    );

    expect(response.status).toBe(401);
    await expect(response.json()).resolves.toEqual({ message: "Invalid credentials" });
  });

  it("returns an unavailable response for unexpected errors", async () => {
    vi.mocked(authServerApi.login).mockRejectedValueOnce(new Error("network unavailable"));

    const response = await POST(
      createRequest({
        email: "maya@example.com",
        password: "password123",
      }),
    );

    expect(response.status).toBe(502);
    await expect(response.json()).resolves.toEqual({
      message: "Login is unavailable right now.",
    });
  });
});

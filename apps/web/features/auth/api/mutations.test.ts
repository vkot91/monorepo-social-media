import { describe, expect, it, vi } from "vitest";

import { bffClient } from "#/shared/lib/api/api-client/bff-client";

import { login, logout, register } from "./mutations";

vi.mock("#/shared/lib/api/api-client/bff-client", () => ({
  bffClient: vi.fn(),
}));

describe("auth mutations", () => {
  it("submits login credentials to the auth endpoint without requiring a token", async () => {
    vi.mocked(bffClient).mockResolvedValueOnce({ accessToken: "at", refreshToken: "rt" });

    await login({ email: "user@example.com", password: "password123" });

    expect(bffClient).toHaveBeenCalledWith("/api/auth/login", "POST", {
      auth: false,
      body: { email: "user@example.com", password: "password123" },
    });
  });

  it("submits registration data to the auth endpoint without requiring a token", async () => {
    vi.mocked(bffClient).mockResolvedValueOnce({ accessToken: "at", refreshToken: "rt" });

    await register({
      displayName: "New User",
      email: "new@example.com",
      password: "password123",
      username: "new_user",
    });

    expect(bffClient).toHaveBeenCalledWith("/api/auth/register", "POST", {
      auth: false,
      body: {
        displayName: "New User",
        email: "new@example.com",
        password: "password123",
        username: "new_user",
      },
    });
  });

  it("submits a logout request without requiring a token", async () => {
    vi.mocked(bffClient).mockResolvedValueOnce(null);

    await logout();

    expect(bffClient).toHaveBeenCalledWith("/api/auth/logout", "POST", {
      auth: false,
    });
  });
});

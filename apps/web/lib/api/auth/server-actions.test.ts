import { beforeEach, describe, expect, it, vi } from "vitest";
import { serverRequest } from "../requests/server-request";
import { authServerApi } from "./server-actions";

vi.mock("../requests/server-request", () => ({
  serverRequest: vi.fn(),
}));

describe("authServerApi", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("logs in through the backend auth endpoint", async () => {
    await authServerApi.login({
      email: "maya@example.com",
      password: "password123",
    });

    expect(serverRequest).toHaveBeenCalledWith("/auth/login", "POST", {
      body: {
        email: "maya@example.com",
        password: "password123",
      },
    });
  });

  it("registers through the backend auth endpoint", async () => {
    await authServerApi.register({
      displayName: "Maya Johnson",
      email: "maya@example.com",
      password: "password123",
      username: "maya",
    });

    expect(serverRequest).toHaveBeenCalledWith("/auth/register", "POST", {
      body: {
        displayName: "Maya Johnson",
        email: "maya@example.com",
        password: "password123",
        username: "maya",
      },
    });
  });

  it("refreshes tokens through the backend auth endpoint", async () => {
    await authServerApi.refresh({
      refreshToken: "refresh-token",
    });

    expect(serverRequest).toHaveBeenCalledWith("/auth/refresh", "POST", {
      body: {
        refreshToken: "refresh-token",
      },
    });
  });

  it("logs out through the backend auth endpoint", async () => {
    await authServerApi.logout({
      refreshToken: "refresh-token",
    });

    expect(serverRequest).toHaveBeenCalledWith("/auth/logout", "POST", {
      body: {
        refreshToken: "refresh-token",
      },
    });
  });
});

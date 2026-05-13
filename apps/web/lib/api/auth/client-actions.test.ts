import { beforeEach, describe, expect, it, vi } from "vitest";
import { clientRequest } from "../requests/client-request";
import { authClientApi } from "./client-actions";

vi.mock("../requests/client-request", () => ({
  clientRequest: vi.fn(),
}));

describe("authClientApi", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("logs in through the local auth route", async () => {
    await authClientApi.login({
      email: "maya@example.com",
      password: "password123",
    });

    expect(clientRequest).toHaveBeenCalledWith("/api/auth/login", "POST", {
      body: {
        email: "maya@example.com",
        password: "password123",
      },
    });
  });

  it("registers through the local auth route", async () => {
    await authClientApi.register({
      displayName: "Maya Johnson",
      email: "maya@example.com",
      password: "password123",
      username: "maya",
    });

    expect(clientRequest).toHaveBeenCalledWith("/api/auth/register", "POST", {
      body: {
        displayName: "Maya Johnson",
        email: "maya@example.com",
        password: "password123",
        username: "maya",
      },
    });
  });

  it("logs out through the local auth route", async () => {
    await authClientApi.logout();

    expect(clientRequest).toHaveBeenCalledWith("/api/auth/logout", "POST", {});
  });
});

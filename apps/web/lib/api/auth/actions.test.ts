import type { AuthResponse } from "@social/contracts";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { serverRequest } from "../requests/server-request";
import { ApiRequestError, AuthRequiredError } from "../utils/errors";
import { login, logout, signup } from "./actions";
import { clearAuthCookies, getRefreshToken } from "./cookies";
import { persistAuthSession } from "./session";

vi.mock("../requests/server-request", () => ({
  serverRequest: vi.fn(),
}));

vi.mock("./cookies", () => ({
  clearAuthCookies: vi.fn(),
  getRefreshToken: vi.fn(),
}));

vi.mock("./session", () => ({
  persistAuthSession: vi.fn(),
}));

vi.mock("next/navigation", () => ({
  redirect: vi.fn((path: string) => {
    throw new Error(`redirect:${path}`);
  }),
}));

const authResponse: AuthResponse = {
  accessToken: "access-token",
  refreshToken: "refresh-token",
};

describe("auth actions", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("login", () => {
    it("returns validation errors for invalid credentials", async () => {
      const result = await login({
        email: "not-an-email",
        password: "short",
      });

      expect(result.status).toBe("error");
      expect(result.message).toBe("Enter a valid email and password.");
      expect(result.errors.email).toBeDefined();
      expect(result.errors.password).toBeDefined();
      expect(serverRequest).not.toHaveBeenCalled();
      expect(persistAuthSession).not.toHaveBeenCalled();
    });

    it("logs in, persists the session, and returns success", async () => {
      vi.mocked(serverRequest).mockResolvedValueOnce(authResponse);

      const result = await login({
        email: " Maya@Example.com ",
        password: "password123",
      });

      expect(serverRequest).toHaveBeenCalledWith("/auth/login", "POST", {
        auth: false,
        body: {
          email: "maya@example.com",
          password: "password123",
        },
      });
      expect(persistAuthSession).toHaveBeenCalledWith(authResponse);
      expect(result).toEqual({
        data: null,
        errors: {},
        message: null,
        status: "success",
      });
    });

    it("returns API errors as action state", async () => {
      vi.mocked(serverRequest).mockRejectedValueOnce(
        new ApiRequestError("Invalid credentials", 401, {
          email: ["Email or password is incorrect."],
        }),
      );

      const result = await login({
        email: "maya@example.com",
        password: "password123",
      });

      expect(result).toEqual({
        data: null,
        errors: {
          email: ["Email or password is incorrect."],
        },
        message: "Invalid credentials",
        status: "error",
      });
      expect(persistAuthSession).not.toHaveBeenCalled();
    });

    it("redirects to login when auth is required", async () => {
      vi.mocked(serverRequest).mockRejectedValueOnce(new AuthRequiredError());

      await expect(
        login({
          email: "maya@example.com",
          password: "password123",
        }),
      ).rejects.toThrow("redirect:/login");
    });
  });

  describe("signup", () => {
    it("returns validation errors for invalid registration data", async () => {
      const result = await signup({
        displayName: "M",
        email: "not-an-email",
        password: "short",
        username: "no spaces",
      });

      expect(result.status).toBe("error");
      expect(result.message).toBe("Please check the registration fields.");
      expect(result.errors.displayName).toBeDefined();
      expect(result.errors.email).toBeDefined();
      expect(result.errors.password).toBeDefined();
      expect(result.errors.username).toBeDefined();
      expect(serverRequest).not.toHaveBeenCalled();
      expect(persistAuthSession).not.toHaveBeenCalled();
    });

    it("registers, persists the session, and returns success", async () => {
      vi.mocked(serverRequest).mockResolvedValueOnce(authResponse);

      const result = await signup({
        displayName: " Maya Johnson ",
        email: " Maya@Example.com ",
        password: "password123",
        username: " Maya_01 ",
      });

      expect(serverRequest).toHaveBeenCalledWith("/auth/register", "POST", {
        auth: false,
        body: {
          displayName: "Maya Johnson",
          email: "maya@example.com",
          password: "password123",
          username: "maya_01",
        },
      });
      expect(persistAuthSession).toHaveBeenCalledWith(authResponse);
      expect(result).toEqual({
        data: null,
        errors: {},
        message: null,
        status: "success",
      });
    });

    it("returns unavailable state for unexpected registration errors", async () => {
      vi.mocked(serverRequest).mockRejectedValueOnce(new Error("network unavailable"));

      const result = await signup({
        displayName: "Maya Johnson",
        email: "maya@example.com",
        password: "password123",
        username: "maya",
      });

      expect(result).toEqual({
        data: null,
        errors: {},
        message: "Failed to perform the request. Please try again.",
        status: "error",
      });
      expect(persistAuthSession).not.toHaveBeenCalled();
    });
  });

  describe("logout", () => {
    it("redirects to login when no refresh token exists", async () => {
      vi.mocked(getRefreshToken).mockResolvedValueOnce(null);

      await expect(logout()).rejects.toThrow("redirect:/login");

      expect(serverRequest).not.toHaveBeenCalled();
      expect(clearAuthCookies).not.toHaveBeenCalled();
    });

    it("logs out, clears cookies, and redirects to login", async () => {
      vi.mocked(getRefreshToken).mockResolvedValueOnce("refresh-token");
      vi.mocked(serverRequest).mockResolvedValueOnce(null);

      await expect(logout()).rejects.toThrow("redirect:/login");

      expect(serverRequest).toHaveBeenCalledWith("/auth/logout", "POST", {
        auth: false,
        body: {
          refreshToken: "refresh-token",
        },
      });
      expect(clearAuthCookies).toHaveBeenCalled();
    });

    it("returns API errors when logout fails", async () => {
      vi.mocked(getRefreshToken).mockResolvedValueOnce("refresh-token");
      vi.mocked(serverRequest).mockRejectedValueOnce(new ApiRequestError("Logout failed", 500));

      const result = await logout();

      expect(result).toEqual({
        data: null,
        errors: {},
        message: "Logout failed",
        status: "error",
      });
      expect(clearAuthCookies).not.toHaveBeenCalled();
    });
  });

});

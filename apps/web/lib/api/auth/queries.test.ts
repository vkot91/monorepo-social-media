import type { AuthUserDto } from "@social/contracts";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { serverRequest } from "../requests/server-request";
import { AuthRequiredError } from "../utils/errors";
import { getActiveUser } from "./queries";

vi.mock("../requests/server-request", () => ({
  serverRequest: vi.fn(),
}));

vi.mock("next/navigation", () => ({
  redirect: vi.fn((path: string) => {
    throw new Error(`redirect:${path}`);
  }),
}));

const authUser: AuthUserDto = {
  avatarUrl: null,
  bio: null,
  createdAt: "2026-05-07T10:00:00.000Z",
  displayName: "Maya Johnson",
  email: "maya@example.com",
  id: "user-1",
  username: "maya",
};

describe("auth queries", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("getActiveUser", () => {
    it("returns the active user for server loaders", async () => {
      vi.mocked(serverRequest).mockResolvedValueOnce(authUser);

      await expect(getActiveUser()).resolves.toEqual(authUser);
      expect(serverRequest).toHaveBeenCalledWith("/auth/me", "GET", {});
    });

    it("redirects to login when auth is required", async () => {
      vi.mocked(serverRequest).mockRejectedValueOnce(new AuthRequiredError());

      await expect(getActiveUser()).rejects.toThrow("redirect:/login");
    });

    it("rethrows non-auth failures for the route boundary", async () => {
      const error = new Error("profile unavailable");
      vi.mocked(serverRequest).mockRejectedValueOnce(error);

      await expect(getActiveUser()).rejects.toBe(error);
    });
  });
});

import type { AuthResponse } from "@social/contracts";
import { describe, expect, it, vi } from "vitest";

import { setAuthCookies } from "#/lib/api/auth/cookies";

import { persistAuthSession } from "./session";

vi.mock("#/lib/api/auth/cookies", () => ({
  setAuthCookies: vi.fn(),
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

describe("persistAuthSession", () => {
  it("persists only the token fields as cookies", async () => {
    await persistAuthSession(authResponse);

    expect(setAuthCookies).toHaveBeenCalledWith({
      accessToken: "access-token",
      refreshToken: "refresh-token",
    });
  });
});

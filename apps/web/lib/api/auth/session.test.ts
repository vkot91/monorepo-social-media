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

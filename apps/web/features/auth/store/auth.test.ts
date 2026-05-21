import type { AuthUserDto } from "@social/contracts";
import { afterEach, describe, expect, it } from "vitest";

import { useAuthStore } from "./auth";

const authUser: AuthUserDto = {
  avatarUrl: null,
  bio: null,
  createdAt: "2026-05-07T10:00:00.000Z",
  displayName: "Maya Johnson",
  email: "maya@example.com",
  id: "user-1",
  username: "maya",
};

describe("useAuthStore", () => {
  afterEach(() => {
    useAuthStore.setState({
      user: null,
    });
  });

  it("starts without an authenticated user", () => {
    expect(useAuthStore.getState().user).toBeNull();
  });

  it("stores the authenticated user", () => {
    useAuthStore.getState().setUser(authUser);

    expect(useAuthStore.getState().user).toEqual(authUser);
  });

  it("clears the authenticated user", () => {
    useAuthStore.getState().setUser(authUser);

    useAuthStore.getState().clearUser();

    expect(useAuthStore.getState().user).toBeNull();
  });
});

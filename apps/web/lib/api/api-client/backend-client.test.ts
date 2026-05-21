import { describe, expect, it, vi } from "vitest";

import { getAccessToken } from "#/lib/api/auth/cookies";

import { backendClient } from "./backend-client";
import { createApiClient } from "./request";

const mocks = vi.hoisted(() => ({
  request: vi.fn(),
}));

vi.mock("./request", () => ({
  createApiClient: vi.fn(() => mocks.request),
}));

vi.mock("#/lib/api/auth/cookies", () => ({
  getAccessToken: vi.fn(),
}));

describe("backendClient", () => {
  it("uses the access-token resolver for backend API requests", () => {
    expect(createApiClient).toHaveBeenCalledWith({
      origin: "backend",
      resolveAccessToken: getAccessToken,
    });
    expect(backendClient).toBe(mocks.request);
  });
});

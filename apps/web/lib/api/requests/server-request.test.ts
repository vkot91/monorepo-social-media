import { describe, expect, it, vi } from "vitest";
import { getAccessToken } from "#/lib/api/auth/cookies";
import { createRequest } from "./base-request";
import { serverRequest } from "./server-request";

const mocks = vi.hoisted(() => ({
  request: vi.fn(),
}));

vi.mock("./base-request", () => ({
  createRequest: vi.fn(() => mocks.request),
}));

vi.mock("#/lib/api/auth/cookies", () => ({
  getAccessToken: vi.fn(),
}));

describe("serverRequest", () => {
  it("uses the access-token resolver for server-side API requests", () => {
    expect(createRequest).toHaveBeenCalledWith({
      resolveAccessToken: getAccessToken,
    });
    expect(serverRequest).toBe(mocks.request);
  });
});

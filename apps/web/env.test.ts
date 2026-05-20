import { describe, expect, it, vi } from "vitest";

import { getWebEnv } from "./env";

vi.mock("@social/env", () => ({
  parseWebEnv: vi.fn(() => ({
    NODE_ENV: "test",
    NEXT_PUBLIC_API_URL: "http://localhost:3001",
  })),
}));

describe("getWebEnv", () => {
  it("returns the parsed web environment", () => {
    expect(getWebEnv()).toEqual({
      NODE_ENV: "test",
      NEXT_PUBLIC_API_URL: "http://localhost:3001",
    });
  });
});

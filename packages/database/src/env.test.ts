import { describe, expect, it } from "vitest";

import { getDatabaseUrl } from "./env";

describe("getDatabaseUrl", () => {
  it("returns the validated database URL", () => {
    expect(
      getDatabaseUrl({
        DATABASE_URL: "postgresql://postgres:postgres@127.0.0.1:15432/social_media?schema=public",
      }),
    ).toBe("postgresql://postgres:postgres@127.0.0.1:15432/social_media?schema=public");
  });

  it("returns the test database URL when APP_ENV is test", () => {
    expect(
      getDatabaseUrl({
        APP_ENV: "test",
        DATABASE_URL: "postgresql://social_media_test:social_media_test_password@127.0.0.1:15433/social_media_test",
      }),
    ).toBe("postgresql://social_media_test:social_media_test_password@127.0.0.1:15433/social_media_test");
  });

  it("rejects invalid database URLs", () => {
    expect(() =>
      getDatabaseUrl({
        DATABASE_URL: "not-a-url",
      }),
    ).toThrow();
  });
});

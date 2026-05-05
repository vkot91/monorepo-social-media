import { describe, expect, it } from "vitest";

import { getDatabaseUrl } from "./env";

describe("getDatabaseUrl", () => {
  it("returns the validated database URL", () => {
    expect(
      getDatabaseUrl({
        DATABASE_URL: "postgresql://social_media:social_media_password@127.0.0.1:5432/social_media",
      }),
    ).toBe("postgresql://social_media:social_media_password@127.0.0.1:5432/social_media");
  });

  it("rejects invalid database URLs", () => {
    expect(() =>
      getDatabaseUrl({
        DATABASE_URL: "not-a-url",
      }),
    ).toThrow();
  });
});

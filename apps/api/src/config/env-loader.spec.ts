import { mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

import { loadRootEnv } from "./env";

describe("loadRootEnv", () => {
  const originalEnv = process.env;

  beforeEach(() => {
    process.env = {};
  });

  afterEach(() => {
    process.env = originalEnv;
  });

  it("loads variables from a dotenv file without overriding existing values", () => {
    const directory = mkdtempSync(join(tmpdir(), "social-api-env-"));
    const envPath = join(directory, ".env");

    writeFileSync(
      envPath,
      [
        "# comment",
        "DATABASE_URL=postgresql://social_media:social_media_password@127.0.0.1:5432/social_media",
        "INVALID_LINE",
        "JWT_ACCESS_SECRET=from-file",
        "JWT_REFRESH_SECRET=\"quoted-value\"",
        "",
      ].join("\n"),
    );

    process.env.JWT_ACCESS_SECRET = "from-process";

    loadRootEnv(envPath);

    expect(process.env.DATABASE_URL).toBe(
      "postgresql://social_media:social_media_password@127.0.0.1:5432/social_media",
    );
    expect(process.env.JWT_ACCESS_SECRET).toBe("from-process");
    expect(process.env.JWT_REFRESH_SECRET).toBe("quoted-value");

    rmSync(directory, { recursive: true, force: true });
  });
});

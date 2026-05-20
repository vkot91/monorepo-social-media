import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const importConfig = async () => {
  vi.resetModules();
  return import("./e2e/config");
};

beforeEach(() => {
  vi.stubEnv("PLAYWRIGHT_API_PORT", undefined);
  vi.stubEnv("PLAYWRIGHT_PORT", undefined);
  vi.stubEnv("PORT", undefined);
});

afterEach(() => {
  vi.unstubAllEnvs();
});

describe("e2eConfig", () => {
  it("uses local Playwright defaults", async () => {
    const { e2eConfig } = await importConfig();

    expect(e2eConfig).toEqual({
      apiPort: 3210,
      apiURL: "http://127.0.0.1:3210",
      baseURL: "http://127.0.0.1:3100",
      webPort: 3100,
    });
  });

  it("uses CI PORT when Playwright-specific values are unset", async () => {
    vi.stubEnv("PORT", "3001");

    const { e2eConfig } = await importConfig();

    expect(e2eConfig).toEqual({
      apiPort: 3001,
      apiURL: "http://127.0.0.1:3001",
      baseURL: "http://127.0.0.1:3100",
      webPort: 3100,
    });
  });

  it("ignores inherited public API URLs so tests use the selected API port", async () => {
    vi.stubEnv("PORT", "3001");
    vi.stubEnv("NEXT_PUBLIC_API_URL", "http://localhost:9999");

    const { e2eConfig } = await importConfig();

    expect(e2eConfig.apiURL).toBe("http://127.0.0.1:3001");
  });

  it("prefers Playwright-specific ports over generic app ports", async () => {
    vi.stubEnv("PLAYWRIGHT_PORT", "3200");
    vi.stubEnv("PLAYWRIGHT_API_PORT", "3300");
    vi.stubEnv("PORT", "3001");

    const { e2eConfig } = await importConfig();

    expect(e2eConfig).toMatchObject({
      apiPort: 3300,
      apiURL: "http://127.0.0.1:3300",
      baseURL: "http://127.0.0.1:3200",
      webPort: 3200,
    });
  });

  it("rejects invalid port values", async () => {
    vi.stubEnv("PLAYWRIGHT_API_PORT", "not-a-port");

    await expect(importConfig()).rejects.toThrow("PLAYWRIGHT_API_PORT must be a positive integer.");
  });
});

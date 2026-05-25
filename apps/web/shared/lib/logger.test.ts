import { afterEach, describe, expect, it, vi } from "vitest";

import { logger } from "./logger";

describe("logger", () => {
  afterEach(() => {
    vi.unstubAllEnvs();
    vi.restoreAllMocks();
  });

  it("writes errors to console.error", () => {
    vi.stubEnv("NODE_ENV", "development");
    const errorSpy = vi.spyOn(console, "error").mockImplementation(() => {});
    const payload = {
      requestId: "request-1",
    };

    logger.error("api_request_failed", payload);

    expect(errorSpy).toHaveBeenCalledWith("api_request_failed", payload);
  });

  it("writes info messages to console.info", () => {
    vi.stubEnv("NODE_ENV", "development");
    const infoSpy = vi.spyOn(console, "info").mockImplementation(() => {});
    const payload = {
      userId: "user-1",
    };

    logger.info("user_signed_in", payload);

    expect(infoSpy).toHaveBeenCalledWith("user_signed_in", payload);
  });

  it("writes warnings to console.warn", () => {
    vi.stubEnv("NODE_ENV", "development");
    const warnSpy = vi.spyOn(console, "warn").mockImplementation(() => {});
    const payload = {
      attempt: 1,
    };

    logger.warn("api_request_retry", payload);

    expect(warnSpy).toHaveBeenCalledWith("api_request_retry", payload);
  });

  it("does not write logs in test env", () => {
    vi.stubEnv("NODE_ENV", "test");
    const errorSpy = vi.spyOn(console, "error").mockImplementation(() => {});
    const infoSpy = vi.spyOn(console, "info").mockImplementation(() => {});
    const warnSpy = vi.spyOn(console, "warn").mockImplementation(() => {});

    logger.error("api_request_failed", {});
    logger.info("user_signed_in", {});
    logger.warn("api_request_retry", {});

    expect(errorSpy).not.toHaveBeenCalled();
    expect(infoSpy).not.toHaveBeenCalled();
    expect(warnSpy).not.toHaveBeenCalled();
  });
});

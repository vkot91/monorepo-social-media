import { afterEach, describe, expect, it, vi } from "vitest";

import { logger } from "./logger";

describe("logger", () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("writes errors to console.error", () => {
    const errorSpy = vi.spyOn(console, "error").mockImplementation(() => {});
    const payload = {
      requestId: "request-1",
    };

    logger.error("api_request_failed", payload);

    expect(errorSpy).toHaveBeenCalledWith("api_request_failed", payload);
  });

  it("writes info messages to console.info", () => {
    const infoSpy = vi.spyOn(console, "info").mockImplementation(() => {});
    const payload = {
      userId: "user-1",
    };

    logger.info("user_signed_in", payload);

    expect(infoSpy).toHaveBeenCalledWith("user_signed_in", payload);
  });

  it("writes warnings to console.warn", () => {
    const warnSpy = vi.spyOn(console, "warn").mockImplementation(() => {});
    const payload = {
      attempt: 1,
    };

    logger.warn("api_request_retry", payload);

    expect(warnSpy).toHaveBeenCalledWith("api_request_retry", payload);
  });
});

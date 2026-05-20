import { Logger } from "@nestjs/common";

import { LoggingService } from "./logging.service";

const originalNodeEnv = process.env.NODE_ENV;

describe("LoggingService", () => {
  let service: LoggingService;

  beforeEach(() => {
    service = new LoggingService();
  });

  afterEach(() => {
    process.env.NODE_ENV = originalNodeEnv;
    jest.restoreAllMocks();
  });

  it("writes logs outside test env", () => {
    process.env.NODE_ENV = "development";
    const log = jest.spyOn(Logger.prototype, "log").mockImplementation();

    service.log("TestContext", { event: "request_finished" });

    expect(log).toHaveBeenCalledWith({ event: "request_finished" });
  });

  it("writes errors outside test env", () => {
    process.env.NODE_ENV = "development";
    const error = jest.spyOn(Logger.prototype, "error").mockImplementation();

    service.error("TestContext", "request_failed", "stack");

    expect(error).toHaveBeenCalledWith("request_failed", "stack");
  });

  it("does not write logs in test env", () => {
    process.env.NODE_ENV = "test";
    const log = jest.spyOn(Logger.prototype, "log").mockImplementation();
    const error = jest.spyOn(Logger.prototype, "error").mockImplementation();
    const warn = jest.spyOn(Logger.prototype, "warn").mockImplementation();

    service.log("TestContext", "request_finished");
    service.error("TestContext", "request_failed", "stack");
    service.warn("TestContext", "request_retry");

    expect(log).not.toHaveBeenCalled();
    expect(error).not.toHaveBeenCalled();
    expect(warn).not.toHaveBeenCalled();
  });
});

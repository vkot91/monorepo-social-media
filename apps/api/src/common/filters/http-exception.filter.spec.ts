import { BadRequestException, HttpException, HttpStatus, Logger } from "@nestjs/common";

import { HttpExceptionFilter } from "./http-exception.filter";

function createHost() {
  const json = jest.fn();
  const status = jest.fn(() => ({ json }));
  const host = {
    switchToHttp: jest.fn(() => ({
      getRequest: jest.fn(() => ({ requestStartedAt: 100, url: "/test" })),
      getResponse: jest.fn(() => ({ status })),
    })),
  };

  return {
    host,
    json,
    status,
  };
}

describe("HttpExceptionFilter", () => {
  const filter = new HttpExceptionFilter();

  beforeEach(() => {
    jest.spyOn(Logger.prototype, "error").mockImplementation();
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it("serializes Nest HTTP exceptions", () => {
    jest.spyOn(Date, "now").mockReturnValue(150);
    const { host, json, status } = createHost();

    filter.catch(new BadRequestException(["email must be an email"]), host as never);

    expect(status).toHaveBeenCalledWith(HttpStatus.BAD_REQUEST);
    expect(json).toHaveBeenCalledWith({
      error: "Bad Request",
      message: ["email must be an email"],
      path: "/test",
      statusCode: HttpStatus.BAD_REQUEST,
      timestamp: expect.any(String),
    });
    expect(Logger.prototype.error).toHaveBeenCalledWith({
      durationMs: 50,
      errorName: "BadRequestException",
      method: "UNKNOWN",
      path: "/test",
      requestId: expect.any(String),
      statusCode: HttpStatus.BAD_REQUEST,
    });
  });

  it("serializes non-HTTP exceptions without leaking details", () => {
    const { host, json, status } = createHost();

    filter.catch(new Error("database exploded"), host as never);

    expect(status).toHaveBeenCalledWith(HttpStatus.INTERNAL_SERVER_ERROR);
    expect(json).toHaveBeenCalledWith({
      error: "Internal Server Error",
      message: "Internal server error",
      path: "/test",
      statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
      timestamp: expect.any(String),
    });
  });

  it("serializes string HTTP exception responses", () => {
    const { host, json, status } = createHost();

    filter.catch(new HttpException("plain failure", HttpStatus.I_AM_A_TEAPOT), host as never);

    expect(status).toHaveBeenCalledWith(HttpStatus.I_AM_A_TEAPOT);
    expect(json).toHaveBeenCalledWith({
      error: "HttpException",
      message: "plain failure",
      path: "/test",
      statusCode: HttpStatus.I_AM_A_TEAPOT,
      timestamp: expect.any(String),
    });
  });

  it("fills missing object response fields from the exception", () => {
    const { host, json, status } = createHost();

    filter.catch(new HttpException({}, HttpStatus.CONFLICT), host as never);

    expect(status).toHaveBeenCalledWith(HttpStatus.CONFLICT);
    expect(json).toHaveBeenCalledWith({
      error: "HttpException",
      message: "Http Exception",
      path: "/test",
      statusCode: HttpStatus.CONFLICT,
      timestamp: expect.any(String),
    });
  });
});

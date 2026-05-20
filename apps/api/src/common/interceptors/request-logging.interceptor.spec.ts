import { type CallHandler, type ExecutionContext } from "@nestjs/common";
import { firstValueFrom, timer } from "rxjs";
import { map } from "rxjs/operators";

import { LoggingService } from "#common/logging/logging.service";

import { RequestLoggingInterceptor } from "./request-logging.interceptor";

const createContext = () =>
  ({
    switchToHttp: () => ({
      getRequest: () => ({
        headers: {
          "x-request-id": "request-123",
        },
        method: "GET",
        requestStartedAt: 1_000,
        url: "/posts",
      }),
      getResponse: () => ({
        statusCode: 200,
      }),
    }),
  }) as unknown as ExecutionContext;

const createLoggingService = () =>
  ({
    error: jest.fn(),
    log: jest.fn(),
    warn: jest.fn(),
  }) as unknown as jest.Mocked<LoggingService>;

describe("RequestLoggingInterceptor", () => {
  afterEach(() => {
    jest.useRealTimers();
  });

  it("logs successful request completion details", async () => {
    jest.useFakeTimers();
    jest.setSystemTime(1_000);
    const loggingService = createLoggingService();
    const interceptor = new RequestLoggingInterceptor(loggingService);
    const next = {
      handle: () => timer(50).pipe(map(() => "ok")),
    } as CallHandler;
    const result = firstValueFrom(interceptor.intercept(createContext(), next));

    await jest.advanceTimersByTimeAsync(50);
    await expect(result).resolves.toBe("ok");

    expect(loggingService.log).toHaveBeenCalledWith(RequestLoggingInterceptor.name, {
      durationMs: 50,
      method: "GET",
      path: "/posts",
      requestId: "request-123",
      statusCode: 200,
    });
  });
});

import { type CallHandler, type ExecutionContext, Logger } from "@nestjs/common";
import { firstValueFrom, timer } from "rxjs";
import { map } from "rxjs/operators";

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

describe("RequestLoggingInterceptor", () => {
  it("logs successful request completion details", async () => {
    jest.useFakeTimers();
    jest.setSystemTime(1_000);
    const log = jest.spyOn(Logger.prototype, "log").mockImplementation();
    const interceptor = new RequestLoggingInterceptor();
    const next = {
      handle: () => timer(50).pipe(map(() => "ok")),
    } as CallHandler;
    const result = firstValueFrom(interceptor.intercept(createContext(), next));

    await jest.advanceTimersByTimeAsync(50);
    await expect(result).resolves.toBe("ok");

    expect(log).toHaveBeenCalledWith({
      durationMs: 50,
      method: "GET",
      path: "/posts",
      requestId: "request-123",
      statusCode: 200,
    });

    jest.useRealTimers();
  });
});

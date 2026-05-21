import { type CallHandler, type ExecutionContext, InternalServerErrorException } from "@nestjs/common";
import { lastValueFrom, type Observable, of } from "rxjs";
import { z } from "zod";

import type { LoggingService } from "#common/logging/logging.service";

import { ZodResponseInterceptor } from "./response.interceptor";

describe("ZodResponseInterceptor", () => {
  const context = {} as ExecutionContext;
  const loggingService = {
    error: jest.fn(),
    log: jest.fn(),
    warn: jest.fn(),
  } as unknown as jest.Mocked<LoggingService>;

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("strips extra object fields from successful responses", async () => {
    const Interceptor = ZodResponseInterceptor(z.object({ id: z.string() }));
    const interceptor = new Interceptor(loggingService);
    const next = {
      handle: () => of({ id: "post-1", internalOnly: true }),
    } satisfies CallHandler;

    const response = interceptor.intercept(context, next) as Observable<{ id: string }>;

    await expect(lastValueFrom(response)).resolves.toEqual({
      id: "post-1",
    });
    expect(loggingService.error).not.toHaveBeenCalled();
  });

  it("logs through the custom logger and throws an internal server error when the response shape is invalid", async () => {
    const Interceptor = ZodResponseInterceptor(z.object({ id: z.string() }));
    const interceptor = new Interceptor(loggingService);
    const next = {
      handle: () => of({ id: null }),
    } satisfies CallHandler;

    const response = interceptor.intercept(context, next) as Observable<{ id: string }>;

    await expect(lastValueFrom(response)).rejects.toBeInstanceOf(InternalServerErrorException);
    expect(loggingService.error).toHaveBeenCalledWith(expect.any(String), {
      errors: expect.objectContaining({
        fieldErrors: expect.objectContaining({
          id: ["Expected string, received null"],
        }),
      }),
      message: "Response validation failed",
    });
  });
});

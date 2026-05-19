import { type CallHandler, type ExecutionContext, RequestTimeoutException } from "@nestjs/common";
import { Reflector } from "@nestjs/core";
import { firstValueFrom, of, throwError, timer } from "rxjs";
import { map } from "rxjs/operators";

import { REQUEST_TIMEOUT_KEY } from "#common/decorators/request-timeout.decorator";

import { DEFAULT_REQUEST_TIMEOUT_MS, TimeoutInterceptor } from "./timeout.interceptor";

const createContext = (handler: () => void) =>
  ({
    getHandler: () => handler,
  }) as unknown as ExecutionContext;

describe("TimeoutInterceptor", () => {
  const reflector = {
    get: jest.fn(),
  } as unknown as jest.Mocked<Reflector>;
  const interceptor = new TimeoutInterceptor(reflector);
  const handler = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it("falls back to the default timeout when no override exists", async () => {
    reflector.get.mockReturnValue(undefined);
    const next = {
      handle: () => timer(DEFAULT_REQUEST_TIMEOUT_MS + 1).pipe(map(() => "late")),
    } as CallHandler;

    const result = expect(
      firstValueFrom(interceptor.intercept(createContext(handler), next)),
    ).rejects.toBeInstanceOf(RequestTimeoutException);
    await jest.advanceTimersByTimeAsync(DEFAULT_REQUEST_TIMEOUT_MS + 1);

    await result;
    expect(reflector.get).toHaveBeenCalledWith(REQUEST_TIMEOUT_KEY, handler);
  });

  it("uses a route override when one exists", async () => {
    reflector.get.mockReturnValue(5);
    const next = {
      handle: () => timer(6).pipe(map(() => "late")),
    } as CallHandler;

    const result = expect(
      firstValueFrom(interceptor.intercept(createContext(handler), next)),
    ).rejects.toBeInstanceOf(RequestTimeoutException);
    await jest.advanceTimersByTimeAsync(6);

    await result;
  });

  it("passes through responses that complete in time", async () => {
    reflector.get.mockReturnValue(undefined);
    const next = {
      handle: () => of("ok"),
    } as CallHandler;

    await expect(firstValueFrom(interceptor.intercept(createContext(handler), next))).resolves.toBe("ok");
  });

  it("passes through non-timeout errors unchanged", async () => {
    reflector.get.mockReturnValue(undefined);
    const error = new Error("boom");
    const next = {
      handle: () => throwError(() => error),
    } as CallHandler;

    await expect(firstValueFrom(interceptor.intercept(createContext(handler), next))).rejects.toBe(error);
  });
});

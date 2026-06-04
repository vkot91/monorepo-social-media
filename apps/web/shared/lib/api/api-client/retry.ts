import { logger } from "#/shared/lib/logger";

import type { ApiMethod, RetryOptions } from "./types";

export type RetrySettings = {
  delayMs: number;
  maxDelayMs: number;
  retries: number;
  retryStatuses: number[];
};

const DEFAULT_RETRY: RetrySettings = {
  delayMs: 250,
  maxDelayMs: 2_000,
  retries: 2,
  retryStatuses: [429, 502, 503, 504],
};

export const getRetrySettings = (method: ApiMethod, retry?: boolean | RetryOptions): RetrySettings | null => {
  if (retry === false) return null;

  const options = typeof retry === "object" ? retry : {};

  // By default only GET requests are retried. Pass `retry: true` or `retry: { retryMethods: [...] }`
  // to opt mutations into retry (only safe for idempotent operations).
  const retryMethods = retry === undefined ? ["GET"] : options.retryMethods;

  if (retryMethods && !retryMethods.includes(method)) return null;

  return {
    delayMs: options.delayMs ?? DEFAULT_RETRY.delayMs,
    maxDelayMs: options.maxDelayMs ?? DEFAULT_RETRY.maxDelayMs,
    retries: options.attempts ?? DEFAULT_RETRY.retries,
    retryStatuses: options.retryStatuses ?? DEFAULT_RETRY.retryStatuses,
  };
};

const isRetryableResponse = (response: Response, retry: RetrySettings) =>
  retry.retryStatuses.includes(response.status);

const isAbortError = (error: unknown) =>
  typeof error === "object" && error !== null && "name" in error && error.name === "AbortError";

const getRetryDelayMs = (attempt: number, retry: RetrySettings) =>
  Math.min(retry.delayMs * 2 ** (attempt - 1), retry.maxDelayMs);

const sleep = (ms: number) => new Promise<void>((resolve) => setTimeout(resolve, ms));

export const fetchWithRetry = async (
  url: string,
  init: RequestInit,
  retry: RetrySettings | null,
  requestId: string,
): Promise<Response> => {
  const maxAttempts = (retry?.retries ?? 0) + 1;

  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    const isLastAttempt = attempt === maxAttempts;

    // On retries, add a fresh AbortSignal so Next.js fetch memoization does not
    // serve the previously cached failed response for the same URL+headers.
    const fetchInit: RequestInit =
      attempt > 1 && !init.signal ? { ...init, signal: new AbortController().signal } : init;

    try {
      const response = await fetch(url, fetchInit);

      if (isLastAttempt || !retry || !isRetryableResponse(response, retry)) {
        if (isLastAttempt && retry && isRetryableResponse(response, retry)) {
          logger.error("api_request_failed", {
            attempts: attempt,
            method: init.method,
            requestId,
            statusCode: response.status,
            url,
          });
        }
        return response;
      }

      const delayMs = getRetryDelayMs(attempt, retry);
      logger.warn("api_request_retry", {
        attempt,
        delayMs,
        method: init.method,
        requestId,
        statusCode: response.status,
        url,
      });
      await sleep(delayMs);
    } catch (error) {
      if (isLastAttempt || !retry || isAbortError(error)) {
        if (isLastAttempt && retry && !isAbortError(error)) {
          logger.error("api_request_failed", {
            attempts: attempt,
            errorName: error instanceof Error ? error.name : "UnknownError",
            method: init.method,
            requestId,
            url,
          });
        }
        throw error;
      }

      const delayMs = getRetryDelayMs(attempt, retry);
      logger.warn("api_request_retry", {
        attempt,
        delayMs,
        errorName: error instanceof Error ? error.name : "UnknownError",
        method: init.method,
        requestId,
        url,
      });
      await sleep(delayMs);
    }
  }

  throw new Error("Unexpected end of fetchWithRetry");
};

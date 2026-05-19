import { randomUUID } from "node:crypto";

import { getWebEnv } from "#/env";
import { logger } from "#/lib/logger";

import { ApiRequestError, AuthRequiredError } from "../utils/errors";
import {
  ApiMethod,
  ApiPath,
  MethodFor,
  RequestFactoryOptions,
  RequestOptions,
  RetryOptions,
  RouteConfig,
  RouteResponse,
  StrictRequestOptions,
} from "./request.type";

type RequestType = "server" | "web";

export type QueryValue = boolean | number | string | null | undefined;

type RetrySettings = {
  delayMs: number;
  maxDelayMs: number;
  retries: number;
  retryServerErrors: boolean;
  retryStatuses: number[];
};

const DEFAULT_RETRY = {
  delayMs: 250,
  maxDelayMs: 2_000,
  retries: 2,
  retryStatuses: [408, 429],
};

export const appendQueryParams = (url: URL, query?: Record<string, QueryValue>) => {
  for (const [key, value] of Object.entries(query ?? {})) {
    if (value !== null && value !== undefined) {
      url.searchParams.set(key, String(value));
    }
  }

  return url;
};

export async function parseJsonResponse<TResponse>(response: Response): Promise<TResponse> {
  if (response.status === 204) {
    return null as TResponse;
  }

  if (!response.ok) {
    let message = response.statusText || "Request failed";

    try {
      const body = (await response.json()) as { message?: unknown };

      if (typeof body.message === "string") {
        message = body.message;
      }
    } catch {
      // Keep the status text fallback when the response body is not JSON.
    }

    throw new ApiRequestError(message, response.status);
  }

  return (await response.json()) as TResponse;
}

const buildRequestUrl = (path: string, requestType: RequestType, queryParams?: Record<string, QueryValue>) => {
  if (requestType === "web") {
    const url = appendQueryParams(new URL(path, "http://bff.local"), queryParams);

    return `${url.pathname}${url.search}`;
  }

  return appendQueryParams(new URL(path, getWebEnv().NEXT_PUBLIC_API_URL), queryParams).toString();
};

const getRetrySettings = (method: ApiMethod, retry?: boolean | RetryOptions): RetrySettings | null => {
  if (retry === false) {
    return null;
  }

  const options = typeof retry === "object" ? retry : {};
  const retryMethods = retry === undefined ? ["GET"] : options.retryMethods;

  if (retryMethods && !retryMethods.includes(method)) {
    return null;
  }

  return {
    delayMs: options.delayMs ?? DEFAULT_RETRY.delayMs,
    maxDelayMs: options.maxDelayMs ?? DEFAULT_RETRY.maxDelayMs,
    retries: options.attempts ?? DEFAULT_RETRY.retries,
    retryServerErrors: options.retryStatuses === undefined,
    retryStatuses: options.retryStatuses ?? DEFAULT_RETRY.retryStatuses,
  };
};

const isRetryableResponse = (response: Response, retry: RetrySettings) => {
  if (retry.retryStatuses.includes(response.status)) {
    return true;
  }

  return retry.retryServerErrors && response.status >= 500 && response.status < 600;
};

const isRetryableError = (error: unknown) => {
  if (typeof error === "object" && error !== null && "name" in error && error.name === "AbortError") {
    return false;
  }

  return true;
};

const getRetryDelayMs = (retryNumber: number, retry: RetrySettings) => {
  return Math.min(retry.delayMs * 2 ** (retryNumber - 1), retry.maxDelayMs);
};

const sleep = (ms: number) =>
  new Promise<void>((resolve) => {
    setTimeout(resolve, ms);
  });

const withRetrySignal = (init: RequestInit, retryNumber: number): RequestInit => {
  if (retryNumber === 0) {
    return init;
  }

  return {
    ...init,
    signal: new AbortController().signal,
  };
};

const fetchWithRetry = async (
  url: string,
  init: RequestInit,
  retry: RetrySettings | null,
  requestId: string,
  retryNumber = 0,
): Promise<Response> => {
  try {
    const response = await fetch(url, withRetrySignal(init, retryNumber));

    if (!retry || retryNumber >= retry.retries || !isRetryableResponse(response, retry)) {
      if (retry && retryNumber >= retry.retries && isRetryableResponse(response, retry)) {
        logger.error("api_request_failed", {
          attempts: retryNumber + 1,
          method: init.method,
          requestId,
          statusCode: response.status,
          url,
        });
      }

      return response;
    }

    const delayMs = getRetryDelayMs(retryNumber + 1, retry);

    logger.warn("api_request_retry", {
      attempt: retryNumber + 1,
      delayMs,
      method: init.method,
      requestId,
      statusCode: response.status,
      url,
    });

    await sleep(delayMs);

    return fetchWithRetry(url, init, retry, requestId, retryNumber + 1);
  } catch (error) {
    if (!retry || retryNumber >= retry.retries || !isRetryableError(error)) {
      if (retry && retryNumber >= retry.retries && isRetryableError(error)) {
        logger.error("api_request_failed", {
          attempts: retryNumber + 1,
          errorName: error instanceof Error ? error.name : "UnknownError",
          method: init.method,
          requestId,
          url,
        });
      }

      throw error;
    }

    const delayMs = getRetryDelayMs(retryNumber + 1, retry);

    logger.warn("api_request_retry", {
      attempt: retryNumber + 1,
      delayMs,
      errorName: error instanceof Error ? error.name : "UnknownError",
      method: init.method,
      requestId,
      url,
    });

    await sleep(delayMs);

    return fetchWithRetry(url, init, retry, requestId, retryNumber + 1);
  }
};

export const createRequest = ({ resolveAccessToken }: RequestFactoryOptions = {}) => {
  return async function request<
    const TPath extends ApiPath,
    const TMethod extends MethodFor<TPath>,
    const TOptions extends RequestOptions<RouteConfig<TPath, TMethod>>,
  >(
    path: TPath,
    method: TMethod,
    options: StrictRequestOptions<RouteConfig<TPath, TMethod>, TOptions>,
  ): Promise<RouteResponse<RouteConfig<TPath, TMethod>>> {
    const requestType: RequestType = options.requestType ?? "server";
    const requiresAuth = options.auth ?? true;
    const headers: HeadersInit = {};
    const body = "body" in options ? options.body : undefined;
    const queryParams = "queryParams" in options ? options.queryParams : undefined;
    const retrySettings = getRetrySettings(method, options.retry);
    const requestId = randomUUID();
    if (body !== undefined) {
      headers["content-type"] = "application/json";
    }

    headers["x-request-id"] = requestId;

    if (requestType === "server" && requiresAuth) {
      const accessToken = await resolveAccessToken?.();

      if (!accessToken) {
        throw new AuthRequiredError();
      }

      headers.authorization = `Bearer ${accessToken}`;
    }

    const url = buildRequestUrl(path, requestType, queryParams as Record<string, QueryValue> | undefined);
    const fetchOptions: RequestInit = {
      body: body !== undefined ? JSON.stringify(body) : undefined,
      cache: options.cache,
      credentials: requestType === "web" ? "same-origin" : undefined,
      headers,
      method,
    };
    const response = await fetchWithRetry(url, fetchOptions, retrySettings, requestId);

    if (response.status === 401 && requestType === "server" && requiresAuth && options.retryOnUnauthorized !== false) {
      throw new AuthRequiredError();
    }

    return parseJsonResponse<RouteResponse<RouteConfig<TPath, TMethod>>>(response);
  };
};

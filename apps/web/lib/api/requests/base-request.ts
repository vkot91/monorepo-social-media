import { getWebEnv } from "#/env";

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

const buildRequestUrl = (
  path: string,
  requestType: RequestType,
  queryParams?: Record<string, QueryValue>,
) => {
  if (requestType === "web") {
    const url = appendQueryParams(new URL(path, "http://bff.local"), queryParams);

    return `${url.pathname}${url.search}`;
  }

  return appendQueryParams(new URL(path, getWebEnv().NEXT_PUBLIC_API_URL), queryParams).toString();
};

const getRetrySettings = (
  method: ApiMethod,
  retry?: boolean | RetryOptions,
): RetrySettings | null => {
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
  if (
    typeof error === "object" &&
    error !== null &&
    "name" in error &&
    error.name === "AbortError"
  ) {
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

const fetchWithRetry = async (
  url: string,
  init: RequestInit,
  retry: RetrySettings | null,
  retryNumber = 0,
): Promise<Response> => {
  try {
    const response = await fetch(url, init);

    if (!retry || retryNumber >= retry.retries || !isRetryableResponse(response, retry)) {
      return response;
    }

    await sleep(getRetryDelayMs(retryNumber + 1, retry));

    return fetchWithRetry(url, init, retry, retryNumber + 1);
  } catch (error) {
    if (!retry || retryNumber >= retry.retries || !isRetryableError(error)) {
      throw error;
    }

    await sleep(getRetryDelayMs(retryNumber + 1, retry));

    return fetchWithRetry(url, init, retry, retryNumber + 1);
  }
};

const isWebPath = (path: string) => path.startsWith("/api/");

const isPublicPath = (path: string) => path.startsWith("/auth/") || path.startsWith("/api/auth/");

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
    const requestType: RequestType = options.requestType ?? (isWebPath(path) ? "web" : "server");
    const requiresAuth = options.auth ?? !isPublicPath(path);
    const headers: HeadersInit = {};
    const body = "body" in options ? options.body : undefined;
    const queryParams = "queryParams" in options ? options.queryParams : undefined;
    const retrySettings = getRetrySettings(method, options.retry);
    if (body !== undefined) {
      headers["content-type"] = "application/json";
    }

    if (requestType === "server" && requiresAuth) {
      const accessToken = await resolveAccessToken?.();

      if (!accessToken) {
        throw new AuthRequiredError();
      }

      headers.authorization = `Bearer ${accessToken}`;
    }

    const url = buildRequestUrl(
      path,
      requestType,
      queryParams as Record<string, QueryValue> | undefined,
    );
    const fetchOptions: RequestInit = {
      body: body !== undefined ? JSON.stringify(body) : undefined,
      cache: options.cache,
      credentials: requestType === "web" ? "same-origin" : undefined,
      headers,
      method,
    };
    const response = await fetchWithRetry(url, fetchOptions, retrySettings);

    if (
      response.status === 401 &&
      requestType === "server" &&
      requiresAuth &&
      options.retryOnUnauthorized !== false
    ) {
      throw new AuthRequiredError();
    }

    return parseJsonResponse<RouteResponse<RouteConfig<TPath, TMethod>>>(response);
  };
};

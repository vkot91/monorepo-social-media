import { getWebEnv } from "#/env";
import { logger } from "#/shared/lib/logger";

import { ApiRequestError, AuthRequiredError } from "../utils/errors";
import {
  ApiClient,
  ApiClientOptions,
  ApiMethod,
  ApiPath,
  ApiRoutes,
  MethodFor,
  RequestOptions,
  RetryOptions,
  RouteConfig,
  RouteResponse,
  StrictRequestOptions,
} from "./request.type";

export type QueryValue = boolean | number | string | null | undefined;
type RouteParams = Record<string, boolean | number | string>;

type RetrySettings = {
  delayMs: number;
  maxDelayMs: number;
  retries: number;
  retryStatuses: number[];
};

const DEFAULT_RETRY = {
  delayMs: 250,
  maxDelayMs: 2_000,
  retries: 2,
  retryStatuses: [429, 502, 503, 504],
};

export const appendQueryParams = (url: URL, query?: Record<string, QueryValue>) => {
  for (const [key, value] of Object.entries(query ?? {})) {
    if (value !== null && value !== undefined) {
      url.searchParams.set(key, String(value));
    }
  }

  return url;
};

export const interpolatePathParams = (path: string, params?: RouteParams) =>
  path.replace(/\{([^}]+)\}/g, (_, key: string) => {
    const value = params?.[key];

    if (value === undefined) {
      throw new Error(`Missing route param "${key}" for ${path}`);
    }

    return encodeURIComponent(String(value));
  });

export async function parseJsonResponse<TResponse>(response: Response): Promise<TResponse> {
  if (response.status === 204) {
    return null as TResponse;
  }

  if (!response.ok) {
    let message = response.statusText || "Request failed";
    let errors: Record<string, string[]> = {};

    try {
      const body = (await response.json()) as {
        errors?: unknown;
        message?: unknown;
      };

      if (typeof body.message === "string") {
        message = body.message;
      }

      if (typeof body.errors === "object" && body.errors !== null && !Array.isArray(body.errors)) {
        errors = Object.fromEntries(
          Object.entries(body.errors).filter(
            (entry): entry is [string, string[]] =>
              Array.isArray(entry[1]) && entry[1].every((error) => typeof error === "string"),
          ),
        );
      }
    } catch {
      // Keep the status text fallback when the response body is not JSON.
    }

    throw new ApiRequestError(message, response.status, errors);
  }

  return (await response.json()) as TResponse;
}

const buildRequestUrl = (
  path: string,
  origin: ApiClientOptions["origin"],
  params?: RouteParams,
  queryParams?: Record<string, QueryValue>,
) => {
  const interpolatedPath = interpolatePathParams(path, params);

  if (origin === "bff") {
    const qs = new URLSearchParams();

    for (const [key, value] of Object.entries(queryParams ?? {})) {
      if (value !== null && value !== undefined) {
        qs.set(key, String(value));
      }
    }

    const search = qs.size ? `?${qs}` : "";

    return `${interpolatedPath}${search}`;
  }

  return appendQueryParams(new URL(interpolatedPath, getWebEnv().NEXT_PUBLIC_API_URL), queryParams).toString();
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
    retryStatuses: options.retryStatuses ?? DEFAULT_RETRY.retryStatuses,
  };
};

const isRetryableResponse = (response: Response, retry: RetrySettings) => retry.retryStatuses.includes(response.status);

const isRetryableError = (error: unknown) =>
  !(typeof error === "object" && error !== null && "name" in error && error.name === "AbortError");

const getRetryDelayMs = (attempt: number, retry: RetrySettings) =>
  Math.min(retry.delayMs * 2 ** (attempt - 1), retry.maxDelayMs);

const sleep = (ms: number) =>
  new Promise<void>((resolve) => {
    setTimeout(resolve, ms);
  });

const fetchWithRetry = async (
  url: string,
  init: RequestInit,
  retry: RetrySettings | null,
  requestId: string,
): Promise<Response> => {
  const maxAttempts = (retry?.retries ?? 0) + 1;

  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    const isLastAttempt = attempt === maxAttempts;
    const fetchInit = attempt === 1 ? init : { ...init, signal: new AbortController().signal };

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
      if (isLastAttempt || !retry || !isRetryableError(error)) {
        if (isLastAttempt && retry && isRetryableError(error)) {
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

  // Unreachable but required for TypeScript
  throw new Error("Unexpected end of fetchWithRetry");
};

export const createApiClient = <TRoutes extends ApiRoutes>({
  origin,
  resolveAccessToken,
}: ApiClientOptions): ApiClient<TRoutes> => {
  return async function request<
    const TPath extends ApiPath<TRoutes>,
    const TMethod extends MethodFor<TRoutes, TPath>,
    const TOptions extends RequestOptions<RouteConfig<TRoutes, TPath, TMethod>>,
  >(
    path: TPath,
    method: TMethod,
    options: StrictRequestOptions<RouteConfig<TRoutes, TPath, TMethod>, TOptions>,
  ): Promise<RouteResponse<RouteConfig<TRoutes, TPath, TMethod>>> {
    const requiresAuth = options.auth ?? true;
    const headers: HeadersInit = {};
    const body = "body" in options ? options.body : undefined;
    const params = "params" in options ? options.params : undefined;
    const queryParams = "queryParams" in options ? options.queryParams : undefined;

    const retrySettings = origin === "backend" ? getRetrySettings(method, options.retry) : null;
    const requestId = `request-${path}-${JSON.stringify(options)}`;

    if (body !== undefined) {
      headers["content-type"] = "application/json";
    }

    headers["x-request-id"] = requestId;

    if (origin === "backend" && requiresAuth) {
      const accessToken = await resolveAccessToken?.();

      if (!accessToken) {
        throw new AuthRequiredError();
      }

      headers.authorization = `Bearer ${accessToken}`;
    }

    const url = buildRequestUrl(
      path,
      origin,
      params as RouteParams | undefined,
      queryParams as Record<string, QueryValue> | undefined,
    );

    const fetchOptions: RequestInit = {
      body: body !== undefined ? JSON.stringify(body) : undefined,
      cache: options.cache,
      credentials: origin === "bff" ? "same-origin" : undefined,
      headers,
      method,
    };

    const response = await fetchWithRetry(url, fetchOptions, retrySettings, requestId);

    if (response.status === 401 && origin === "backend" && requiresAuth && options.retryOnUnauthorized !== false) {
      throw new AuthRequiredError();
    }

    return parseJsonResponse<RouteResponse<RouteConfig<TRoutes, TPath, TMethod>>>(response);
  } as ApiClient<TRoutes>;
};

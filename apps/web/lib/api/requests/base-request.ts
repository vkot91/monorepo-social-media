import { getWebEnv } from "#/env";
import { ApiRequestError, AuthRequiredError } from "../errors";
import { ApiPath, MethodFor, RequestFactoryOptions, RequestOptions, RouteConfig, RouteResponse, StrictRequestOptions } from "./request.type";

export type ApiMethod = "DELETE" | "GET" | "PATCH" | "POST" | "PUT";
type RequestType = "server" | "web";

export type QueryValue = boolean | number | string | null | undefined;

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

    const response = await fetch(
      buildRequestUrl(path, requestType, queryParams as Record<string, QueryValue> | undefined),
      {
        body: body !== undefined ? JSON.stringify(body) : undefined,
        cache: options.cache,
        credentials: requestType === "web" ? "same-origin" : undefined,
        headers,
        method,
      },
    );

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

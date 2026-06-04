import { getAccessToken, getRefreshToken } from "#/shared/lib/api/auth/cookies";
import { persistAuthSession } from "#/shared/lib/api/auth/session";
import { AuthRequiredError } from "#/shared/lib/api/utils/errors";

import { parseJsonResponse } from "./response";
import { fetchWithRetry, getRetrySettings } from "./retry";
import type { ApiClient, ApiMethod, BackendApiRoutes, QueryValue } from "./types";
import { buildUrl } from "./url";

type PreparedBody =
  | { body: BodyInit; kind: "formData" | "json" }
  | { body: undefined; kind: "empty" };

const prepareBody = (body: unknown): PreparedBody => {
  if (body === undefined) return { body: undefined, kind: "empty" };
  if (typeof FormData !== "undefined" && body instanceof FormData) return { body, kind: "formData" };
  return { body: JSON.stringify(body), kind: "json" };
};

// Single-flight guard: concurrent unauthorized requests share one refresh call.
// The backend rotates refresh tokens on use — racing refreshes would invalidate each other.
let inFlightRefresh: Promise<string | null> | null = null;

const refreshSession = async (): Promise<string | null> => {
  inFlightRefresh ??= (async () => {
    const refreshToken = await getRefreshToken();

    if (!refreshToken) return null;

    try {
      const tokens = await backendClient("/auth/refresh", "POST", {
        auth: false,
        body: { refreshToken },
      });
      await persistAuthSession(tokens);
      return tokens.accessToken;
    } catch {
      return null;
    }
  })().finally(() => {
    inFlightRefresh = null;
  });

  return inFlightRefresh;
};

export const backendClient: ApiClient<BackendApiRoutes> = async (path, method, options) => {
  const requestId = crypto.randomUUID();
  const requiresAuth = options.auth ?? true;

  const body = "body" in options ? options.body : undefined;
  const params = "params" in options ? (options.params as Record<string, boolean | number | string>) : undefined;
  const queryParams = "queryParams" in options ? (options.queryParams as Record<string, QueryValue>) : undefined;

  const url = buildUrl(path, "backend", params, queryParams);
  const preparedBody = prepareBody(body);
  const retrySettings = getRetrySettings(method as ApiMethod, options.retry);

  const buildHeaders = async (accessTokenOverride?: string): Promise<Record<string, string>> => {
    const headers: Record<string, string> = { "x-request-id": requestId };

    if (preparedBody.kind === "json") {
      headers["content-type"] = "application/json";
    }

    if (requiresAuth) {
      const accessToken = accessTokenOverride ?? (await getAccessToken());
      if (!accessToken) throw new AuthRequiredError();
      headers.authorization = `Bearer ${accessToken}`;
    }

    return headers;
  };

  const sendRequest = async ({
    accessTokenOverride,
    freshSignal,
  }: { accessTokenOverride?: string; freshSignal?: boolean } = {}): Promise<Response> => {
    const headers = await buildHeaders(accessTokenOverride);

    const init: RequestInit = {
      body: preparedBody.body,
      cache: options.cache,
      headers,
      method,
    };

    if (options.signal) {
      init.signal = options.signal;
    } else if (freshSignal) {
      // Bust Next.js fetch memoization so the retried request uses a fresh network call
      // instead of the cached unauthorized response.
      init.signal = new AbortController().signal;
    }

    return fetchWithRetry(url, init, retrySettings, requestId);
  };

  // Refresh is only meaningful for authenticated requests. Callers can set
  // retryOnUnauthorized: false to receive the raw API error instead (e.g. when
  // the route intentionally distinguishes 401 from other errors).
  const canRefresh = requiresAuth && options.retryOnUnauthorized !== false;

  let response: Response;
  let refreshed = false;

  try {
    response = await sendRequest();
  } catch (error) {
    // Case 1: access token cookie is missing — buildHeaders threw AuthRequiredError
    // before fetch() was called. Refresh and retry so the request is actually sent.
    if (!canRefresh || !(error instanceof AuthRequiredError)) throw error;

    const newToken = await refreshSession();
    if (!newToken) throw new AuthRequiredError();

    refreshed = true;
    response = await sendRequest({ accessTokenOverride: newToken, freshSignal: true });
  }

  // Case 2: token existed and was sent, but the backend rejected it with 401
  // (expired, revoked, clock skew). Refresh and retry once.
  // `refreshed` prevents a second refresh when Case 1's retry also returns 401.
  if (response.status === 401 && canRefresh && !refreshed) {
    const newToken = await refreshSession();
    if (!newToken) throw new AuthRequiredError();
    response = await sendRequest({ accessTokenOverride: newToken, freshSignal: true });
  }

  if (response.status === 401 && canRefresh) {
    // Refresh was attempted but the backend still rejects the request — session is dead.
    throw new AuthRequiredError();
  }

  // When retryOnUnauthorized is false, a 401 falls through to parseJsonResponse
  // which throws ApiRequestError with the actual error message from the API.
  return parseJsonResponse(response);
};

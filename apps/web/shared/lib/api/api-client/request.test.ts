import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { getAccessToken, getRefreshToken } from "#/shared/lib/api/auth/cookies";
import { persistAuthSession } from "#/shared/lib/api/auth/session";
import { logger } from "#/shared/lib/logger";

import { ApiRequestError, AuthRequiredError } from "../utils/errors";
import { backendClient } from "./backend-client";
import { bffClient } from "./bff-client";
import { parseJsonResponse } from "./response";
import { appendQueryParams, interpolatePathParams } from "./url";

vi.mock("#/env", () => ({
  getWebEnv: vi.fn(() => ({
    NEXT_PUBLIC_API_URL: "http://localhost:3001",
    NODE_ENV: "test",
  })),
}));

vi.mock("#/shared/lib/logger", () => ({
  logger: {
    error: vi.fn(),
    info: vi.fn(),
    warn: vi.fn(),
  },
}));

vi.mock("#/shared/lib/api/auth/cookies", () => ({
  getAccessToken: vi.fn(),
  getRefreshToken: vi.fn(),
}));

vi.mock("#/shared/lib/api/auth/session", () => ({
  persistAuthSession: vi.fn(),
}));

const jsonResponse = (body: unknown, init?: ResponseInit) =>
  new Response(JSON.stringify(body), {
    headers: { "content-type": "application/json" },
    ...init,
  });

const createPostFormData = () => {
  const formData = new FormData();
  formData.append("content", "Hello");
  formData.append("visibility", "PUBLIC");
  return formData;
};

// ─── url.ts ──────────────────────────────────────────────────────────────────

describe("appendQueryParams", () => {
  it("serializes defined values and skips nullish values", () => {
    const url = appendQueryParams(new URL("http://localhost:3001/posts"), {
      authorId: null,
      feed: "friends",
      includeDrafts: false,
      page: 2,
      search: undefined,
    });

    expect(url.toString()).toBe("http://localhost:3001/posts?feed=friends&includeDrafts=false&page=2");
  });
});

describe("interpolatePathParams", () => {
  it("replaces route params with encoded values", () => {
    expect(interpolatePathParams("/posts/{id}", { id: "post/1" })).toBe("/posts/post%2F1");
  });

  it("throws when a route param is missing", () => {
    expect(() => interpolatePathParams("/posts/{id}")).toThrow('Missing route param "id" for /posts/{id}');
  });
});

// ─── response.ts ─────────────────────────────────────────────────────────────

describe("parseJsonResponse", () => {
  it("returns null for no-content responses", async () => {
    await expect(parseJsonResponse(new Response(null, { status: 204 }))).resolves.toBeNull();
  });

  it("throws API errors using the response message when available", async () => {
    await expect(parseJsonResponse(jsonResponse({ message: "Nope" }, { status: 422 }))).rejects.toMatchObject({
      message: "Nope",
      status: 422,
    });
  });

  it("falls back when the API error message is not a string", async () => {
    await expect(
      parseJsonResponse(
        jsonResponse(
          { errors: { email: ["Enter a valid email."] }, message: ["email: Enter a valid email."] },
          { status: 400 },
        ),
      ),
    ).rejects.toEqual(new ApiRequestError("Request failed", 400));
  });

  it("preserves structured field errors when available", async () => {
    await expect(
      parseJsonResponse(
        jsonResponse(
          { errors: { email: ["Email or password is incorrect."] }, message: "Invalid credentials" },
          { status: 401 },
        ),
      ),
    ).rejects.toEqual(new ApiRequestError("Invalid credentials", 401, { email: ["Email or password is incorrect."] }));
  });

  it("falls back to the status text when the error body is not JSON", async () => {
    await expect(
      parseJsonResponse(new Response("not-json", { status: 503, statusText: "Unavailable" })),
    ).rejects.toEqual(new ApiRequestError("Unavailable", 503));
  });
});

// ─── backendClient ────────────────────────────────────────────────────────────

describe("backendClient", () => {
  beforeEach(() => {
    vi.useRealTimers();
    vi.mocked(getAccessToken).mockResolvedValue("access-token");
    vi.mocked(getRefreshToken).mockResolvedValue(null);
    vi.mocked(persistAuthSession).mockResolvedValue(undefined);
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(jsonResponse({ id: "post-1" })));
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.clearAllMocks();
  });

  it("builds JSON backend requests against the API origin", async () => {
    vi.mocked(getAccessToken).mockResolvedValue(null); // auth: false route

    await backendClient("/auth/login", "POST", {
      auth: false,
      body: { email: "maya@example.com", password: "password123" },
      cache: "no-store",
    });

    expect(fetch).toHaveBeenCalledWith("http://localhost:3001/auth/login", {
      body: JSON.stringify({ email: "maya@example.com", password: "password123" }),
      cache: "no-store",
      headers: { "content-type": "application/json", "x-request-id": expect.any(String) },
      method: "POST",
    });
  });

  it("builds authenticated FormData backend requests without forcing a content type", async () => {
    const formData = createPostFormData();

    await backendClient("/posts", "POST", { body: formData, cache: "no-store" });

    expect(fetch).toHaveBeenCalledWith("http://localhost:3001/posts", {
      body: formData,
      cache: "no-store",
      headers: { authorization: "Bearer access-token", "x-request-id": expect.any(String) },
      method: "POST",
    });
  });

  it("adds one request id to outbound requests", async () => {
    await backendClient("/posts", "GET", { queryParams: {} });

    expect(fetch).toHaveBeenCalledWith(
      "http://localhost:3001/posts",
      expect.objectContaining({
        headers: expect.objectContaining({ "x-request-id": expect.any(String) }),
      }),
    );
  });

  it("adds query params and omits nullish values", async () => {
    await backendClient("/posts", "GET", { queryParams: { authorId: undefined, feed: "friends" } });

    expect(fetch).toHaveBeenCalledWith(
      "http://localhost:3001/posts?feed=friends",
      expect.objectContaining({ method: "GET" }),
    );
  });

  it("interpolates typed backend route params", async () => {
    await backendClient("/posts/{id}", "PATCH", { body: createPostFormData(), params: { id: "post/1" } });

    expect(fetch).toHaveBeenCalledWith(
      "http://localhost:3001/posts/post%2F1",
      expect.objectContaining({ method: "PATCH" }),
    );
  });

  it("throws before fetching when an authenticated backend request has no token", async () => {
    vi.mocked(getAccessToken).mockResolvedValue(null);

    await expect(backendClient("/posts", "GET", { queryParams: {} })).rejects.toBeInstanceOf(AuthRequiredError);
    expect(fetch).not.toHaveBeenCalled();
  });

  it("does not require tokens for public auth paths", async () => {
    vi.mocked(getAccessToken).mockResolvedValue(null);

    await backendClient("/auth/logout", "POST", { body: { refreshToken: "refresh-token" }, auth: false });

    expect(getAccessToken).not.toHaveBeenCalled();
    expect(fetch).toHaveBeenCalledWith(
      "http://localhost:3001/auth/logout",
      expect.objectContaining({ headers: expect.objectContaining({ "content-type": "application/json" }) }),
    );
  });

  it("passes configured abort signals to fetch", async () => {
    const abortController = new AbortController();

    await backendClient("/posts", "GET", { queryParams: {}, signal: abortController.signal });

    expect(fetch).toHaveBeenCalledWith(
      "http://localhost:3001/posts",
      expect.objectContaining({ signal: abortController.signal }),
    );
  });

  it("converts unauthorized authenticated server responses into auth-required errors", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(new Response(null, { status: 401 })));

    await expect(backendClient("/posts", "GET", { queryParams: {} })).rejects.toBeInstanceOf(AuthRequiredError);
  });

  it("can surface unauthorized API responses when retry handling is disabled", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(jsonResponse({ message: "Unauthorized" }, { status: 401 })));

    await expect(backendClient("/posts", "GET", { queryParams: {}, retryOnUnauthorized: false })).rejects.toEqual(
      new ApiRequestError("Unauthorized", 401),
    );
  });

  it("refreshes the session and retries once when an authenticated backend request is unauthorized", async () => {
    vi.mocked(getRefreshToken).mockResolvedValue("old-refresh-token");
    vi.mocked(persistAuthSession).mockResolvedValue(undefined);

    const fetchMock = vi.fn((url: string, init: RequestInit) =>
      Promise.resolve(
        url.includes("/auth/refresh")
          ? jsonResponse({ accessToken: "new-token", refreshToken: "new-refresh" })
          : (init.headers as Record<string, string>).authorization === "Bearer new-token"
            ? jsonResponse({ id: "post-1" })
            : new Response(null, { status: 401 }),
      ),
    );
    vi.stubGlobal("fetch", fetchMock);

    await expect(backendClient("/posts", "POST", { body: createPostFormData() })).resolves.toEqual({ id: "post-1" });
    expect(getRefreshToken).toHaveBeenCalledTimes(1);
    expect(persistAuthSession).toHaveBeenCalledTimes(1);
    expect(fetchMock).toHaveBeenCalledTimes(3); // initial + refresh + retry
  });

  it("throws an auth-required error without retrying when the session refresh fails", async () => {
    vi.mocked(getRefreshToken).mockResolvedValue("old-refresh-token");
    const fetchMock = vi.fn((url: string) =>
      Promise.resolve(
        url.includes("/auth/refresh") ? new Response(null, { status: 401 }) : new Response(null, { status: 401 }),
      ),
    );
    vi.stubGlobal("fetch", fetchMock);

    await expect(backendClient("/posts", "POST", { body: createPostFormData() })).rejects.toBeInstanceOf(
      AuthRequiredError,
    );
    expect(getRefreshToken).toHaveBeenCalledTimes(1);
  });

  it("retries at most once when the request stays unauthorized after a refresh", async () => {
    vi.mocked(getRefreshToken).mockResolvedValue("old-refresh-token");

    const fetchMock = vi.fn((url: string) =>
      Promise.resolve(
        url.includes("/auth/refresh")
          ? jsonResponse({ accessToken: "new-token", refreshToken: "new-refresh" })
          : new Response(null, { status: 401 }),
      ),
    );
    vi.stubGlobal("fetch", fetchMock);

    await expect(backendClient("/posts", "POST", { body: createPostFormData() })).rejects.toBeInstanceOf(
      AuthRequiredError,
    );
    expect(getRefreshToken).toHaveBeenCalledTimes(1);
  });

  it("does not refresh the session when unauthorized handling is disabled", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(jsonResponse({ message: "Unauthorized" }, { status: 401 })));

    await expect(backendClient("/posts", "GET", { queryParams: {}, retryOnUnauthorized: false })).rejects.toEqual(
      new ApiRequestError("Unauthorized", 401),
    );
    expect(getRefreshToken).not.toHaveBeenCalled();
  });

  it("refreshes only once when concurrent requests are unauthorized", async () => {
    vi.mocked(getRefreshToken).mockResolvedValue("old-refresh-token");

    const fetchMock = vi.fn((url: string, init: RequestInit) =>
      Promise.resolve(
        url.includes("/auth/refresh")
          ? jsonResponse({ accessToken: "new-token", refreshToken: "new-refresh" })
          : (init.headers as Record<string, string>).authorization === "Bearer new-token"
            ? jsonResponse({ id: "post-1" })
            : new Response(null, { status: 401 }),
      ),
    );
    vi.stubGlobal("fetch", fetchMock);

    await expect(
      Promise.all([
        backendClient("/posts", "POST", { body: createPostFormData() }),
        backendClient("/posts", "POST", { body: createPostFormData() }),
      ]),
    ).resolves.toEqual([{ id: "post-1" }, { id: "post-1" }]);
    expect(getRefreshToken).toHaveBeenCalledTimes(1);
  });

  it("retries GET requests after a network error", async () => {
    vi.useFakeTimers();
    const fetchMock = vi
      .fn()
      .mockRejectedValueOnce(new TypeError("network unavailable"))
      .mockResolvedValueOnce(jsonResponse({ id: "post-1" }));
    vi.stubGlobal("fetch", fetchMock);

    const response = backendClient("/posts", "GET", { queryParams: {} });

    await vi.advanceTimersByTimeAsync(0);
    expect(fetchMock).toHaveBeenCalledTimes(1);
    await vi.advanceTimersByTimeAsync(250);
    await expect(response).resolves.toEqual({ id: "post-1" });
    expect(fetchMock).toHaveBeenCalledTimes(2);
    expect(logger.warn).toHaveBeenCalledWith(
      "api_request_retry",
      expect.objectContaining({
        attempt: 1,
        errorName: "TypeError",
        method: "GET",
        url: "http://localhost:3001/posts",
      }),
    );
  });

  it("retries GET requests after a retryable server response", async () => {
    vi.useFakeTimers();
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce(new Response(null, { status: 503, statusText: "Unavailable" }))
      .mockResolvedValueOnce(jsonResponse({ id: "post-1" }));
    vi.stubGlobal("fetch", fetchMock);

    const response = backendClient("/posts", "GET", { queryParams: {} });

    await vi.advanceTimersByTimeAsync(0);
    expect(fetchMock).toHaveBeenCalledTimes(1);
    await vi.advanceTimersByTimeAsync(250);
    await expect(response).resolves.toEqual({ id: "post-1" });
    expect(fetchMock).toHaveBeenCalledTimes(2);
  });

  it("adds a fresh abort signal to retries so server fetches are not memoized together", async () => {
    vi.useFakeTimers();
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce(new Response(null, { status: 503, statusText: "Unavailable" }))
      .mockResolvedValueOnce(jsonResponse({ id: "post-1" }));
    vi.stubGlobal("fetch", fetchMock);

    const response = backendClient("/posts", "GET", { queryParams: {} });

    await vi.advanceTimersByTimeAsync(0);
    expect(fetchMock).toHaveBeenNthCalledWith(
      1,
      "http://localhost:3001/posts",
      expect.not.objectContaining({ signal: expect.any(AbortSignal) }),
    );

    await vi.advanceTimersByTimeAsync(250);
    await expect(response).resolves.toEqual({ id: "post-1" });
    expect(fetchMock).toHaveBeenNthCalledWith(
      2,
      "http://localhost:3001/posts",
      expect.objectContaining({ signal: expect.any(AbortSignal) }),
    );
    expect(fetchMock.mock.calls[0]?.[1]).toMatchObject({
      headers: { "x-request-id": fetchMock.mock.calls[1]?.[1]?.headers["x-request-id"] },
    });
    expect(logger.warn).toHaveBeenCalledWith(
      "api_request_retry",
      expect.objectContaining({
        attempt: 1,
        method: "GET",
        requestId: fetchMock.mock.calls[0]?.[1]?.headers["x-request-id"],
        statusCode: 503,
        url: "http://localhost:3001/posts",
      }),
    );
  });

  it("retries rate-limited responses using maxDelayMs as the cap", async () => {
    vi.useFakeTimers();
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce(
        jsonResponse({ message: "Too many requests" }, { headers: { "retry-after": "10" }, status: 429 }),
      )
      .mockResolvedValueOnce(jsonResponse({ id: "post-1" }));
    vi.stubGlobal("fetch", fetchMock);

    const response = backendClient("/posts", "GET", { queryParams: {}, retry: { attempts: 1, maxDelayMs: 100 } });

    await vi.advanceTimersByTimeAsync(0);
    expect(fetchMock).toHaveBeenCalledTimes(1);
    await vi.advanceTimersByTimeAsync(99);
    expect(fetchMock).toHaveBeenCalledTimes(1);
    await vi.advanceTimersByTimeAsync(1);
    await expect(response).resolves.toEqual({ id: "post-1" });
    expect(fetchMock).toHaveBeenCalledTimes(2);
  });

  it("does not retry GET requests when retry is disabled", async () => {
    vi.useFakeTimers();
    const fetchMock = vi.fn().mockResolvedValue(new Response(null, { status: 503, statusText: "Unavailable" }));
    vi.stubGlobal("fetch", fetchMock);

    await expect(backendClient("/posts", "GET", { queryParams: {}, retry: false })).rejects.toEqual(
      new ApiRequestError("Unavailable", 503),
    );
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });

  it("does not retry POST requests by default", async () => {
    vi.useFakeTimers();
    const fetchMock = vi.fn().mockResolvedValue(new Response(null, { status: 503, statusText: "Unavailable" }));
    vi.stubGlobal("fetch", fetchMock);

    await expect(backendClient("/posts", "POST", { body: createPostFormData() })).rejects.toEqual(
      new ApiRequestError("Unavailable", 503),
    );
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });

  it("retries POST requests when retry is enabled", async () => {
    vi.useFakeTimers();
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce(new Response(null, { status: 503, statusText: "Unavailable" }))
      .mockResolvedValueOnce(jsonResponse({ id: "post-1" }));
    vi.stubGlobal("fetch", fetchMock);

    const response = backendClient("/posts", "POST", { body: createPostFormData(), retry: true });

    await vi.advanceTimersByTimeAsync(0);
    expect(fetchMock).toHaveBeenCalledTimes(1);
    await vi.advanceTimersByTimeAsync(250);
    await expect(response).resolves.toEqual({ id: "post-1" });
    expect(fetchMock).toHaveBeenCalledTimes(2);
  });

  it("does not retry unauthorized responses", async () => {
    vi.useFakeTimers();
    const fetchMock = vi.fn().mockResolvedValue(new Response(null, { status: 401 }));
    vi.stubGlobal("fetch", fetchMock);

    await expect(backendClient("/posts", "GET", { queryParams: {} })).rejects.toBeInstanceOf(AuthRequiredError);
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });

  it("does not retry validation responses", async () => {
    vi.useFakeTimers();
    const fetchMock = vi.fn().mockResolvedValue(jsonResponse({ message: "Invalid content" }, { status: 400 }));
    vi.stubGlobal("fetch", fetchMock);

    await expect(backendClient("/posts", "POST", { body: createPostFormData(), retry: true })).rejects.toEqual(
      new ApiRequestError("Invalid content", 400),
    );
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });

  it("does not retry aborted requests", async () => {
    vi.useFakeTimers();
    const abortError = new DOMException("The operation was aborted.", "AbortError");
    const fetchMock = vi.fn().mockRejectedValue(abortError);
    vi.stubGlobal("fetch", fetchMock);

    await expect(backendClient("/posts", "GET", { queryParams: {} })).rejects.toBe(abortError);
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });

  it("stops after configured retry attempts and parses the final failed response", async () => {
    vi.useFakeTimers();
    const fetchMock = vi.fn().mockResolvedValue(new Response(null, { status: 503, statusText: "Unavailable" }));
    vi.stubGlobal("fetch", fetchMock);

    const response = backendClient("/posts", "GET", { queryParams: {} });
    const assertion = expect(response).rejects.toEqual(new ApiRequestError("Unavailable", 503));

    await vi.advanceTimersByTimeAsync(250);
    await vi.advanceTimersByTimeAsync(500);
    await assertion;
    expect(fetchMock).toHaveBeenCalledTimes(3);
    expect(logger.error).toHaveBeenCalledWith(
      "api_request_failed",
      expect.objectContaining({ attempts: 3, method: "GET", statusCode: 503, url: "http://localhost:3001/posts" }),
    );
  });

  it("stops after configured retry attempts and rethrows the final network error", async () => {
    vi.useFakeTimers();
    const networkError = new TypeError("network unavailable");
    const fetchMock = vi.fn().mockRejectedValue(networkError);
    vi.stubGlobal("fetch", fetchMock);

    const response = backendClient("/posts", "GET", { queryParams: {} });
    const assertion = expect(response).rejects.toBe(networkError);

    await vi.advanceTimersByTimeAsync(250);
    await vi.advanceTimersByTimeAsync(500);
    await assertion;
    expect(fetchMock).toHaveBeenCalledTimes(3);
    expect(logger.error).toHaveBeenCalledWith(
      "api_request_failed",
      expect.objectContaining({
        attempts: 3,
        errorName: "TypeError",
        method: "GET",
        url: "http://localhost:3001/posts",
      }),
    );
  });

  it("logs unknown errors when exhausted retries reject without an Error object", async () => {
    vi.useFakeTimers();
    const fetchMock = vi.fn().mockRejectedValue("network unavailable");
    vi.stubGlobal("fetch", fetchMock);

    const response = backendClient("/posts", "GET", { queryParams: {}, retry: { attempts: 1, delayMs: 1 } });
    const assertion = expect(response).rejects.toBe("network unavailable");

    await vi.advanceTimersByTimeAsync(1);
    await assertion;
    expect(fetchMock).toHaveBeenCalledTimes(2);
    expect(logger.error).toHaveBeenCalledWith(
      "api_request_failed",
      expect.objectContaining({ attempts: 2, errorName: "UnknownError" }),
    );
  });
});

// ─── bffClient ───────────────────────────────────────────────────────────────

describe("bffClient", () => {
  beforeEach(() => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(new Response(JSON.stringify(null), { status: 200 })));
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  it("uses relative URLs and same-origin credentials for BFF requests", async () => {
    await bffClient("/api/auth/logout", "POST", { auth: false });

    expect(fetch).toHaveBeenCalledWith("/api/auth/logout", {
      body: undefined,
      cache: undefined,
      credentials: "same-origin",
      headers: { "x-request-id": expect.any(String) },
      method: "POST",
      signal: undefined,
    });
  });

  it("interpolates typed BFF route params", async () => {
    await bffClient("/api/posts/{id}", "DELETE", { params: { id: "post/1" } });

    expect(fetch).toHaveBeenCalledWith("/api/posts/post%2F1", expect.objectContaining({ method: "DELETE" }));
  });

  it("does not retry BFF requests", async () => {
    vi.useFakeTimers();
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(new Response(null, { status: 503, statusText: "Unavailable" })));

    await expect(bffClient("/api/posts", "GET", { queryParams: {} })).rejects.toEqual(
      new ApiRequestError("Unavailable", 503),
    );
    expect(fetch).toHaveBeenCalledTimes(1);
    vi.useRealTimers();
  });

  it("keeps backend and BFF route maps distinct at compile time", () => {
    const shouldRunTypeAssertions = Date.now() < 0;

    if (shouldRunTypeAssertions) {
      void backendClient("/posts", "GET", { queryParams: {} });
      void bffClient("/api/posts", "GET", { queryParams: {} });
      // @ts-expect-error backend clients cannot call BFF routes.
      void backendClient("/api/posts", "GET", { queryParams: {} });
      // @ts-expect-error BFF clients cannot call backend API routes.
      void bffClient("/posts", "GET", { queryParams: {} });
      // @ts-expect-error route params are required for templated backend paths.
      void backendClient("/posts/{id}", "PATCH", { body: createPostFormData() });
      void bffClient("/api/posts/{id}", "DELETE", {
        params: {
          id: "post-1",
          // @ts-expect-error route params cannot include undeclared keys.
          slug: "post",
        },
      });
    }

    expect(backendClient).toBeTypeOf("function");
    expect(bffClient).toBeTypeOf("function");
  });
});

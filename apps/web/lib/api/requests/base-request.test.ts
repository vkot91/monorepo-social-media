import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { logger } from "#/lib/logger";

import { ApiRequestError, AuthRequiredError } from "../utils/errors";
import { appendQueryParams, createRequest, parseJsonResponse } from "./base-request";

vi.mock("#/env", () => ({
  getWebEnv: vi.fn(() => ({
    NEXT_PUBLIC_API_URL: "http://localhost:3001",
    NODE_ENV: "test",
  })),
}));

vi.mock("#/lib/logger", () => ({
  logger: {
    error: vi.fn(),
    info: vi.fn(),
    warn: vi.fn(),
  },
}));

const jsonResponse = (body: unknown, init?: ResponseInit) =>
  new Response(JSON.stringify(body), {
    headers: {
      "content-type": "application/json",
    },
    ...init,
  });

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
          {
            errors: {
              email: ["Enter a valid email."],
            },
            message: ["email: Enter a valid email."],
          },
          { status: 400 },
        ),
      ),
    ).rejects.toEqual(new ApiRequestError("Request failed", 400));
  });

  it("falls back to the status text when the error body is not JSON", async () => {
    await expect(
      parseJsonResponse(new Response("not-json", { status: 503, statusText: "Unavailable" })),
    ).rejects.toEqual(new ApiRequestError("Unavailable", 503));
  });
});

describe("createRequest", () => {
  beforeEach(() => {
    vi.useRealTimers();
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(jsonResponse({ id: "post-1" })));
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.clearAllMocks();
  });

  it("builds authenticated server requests against the API origin", async () => {
    const request = createRequest({
      resolveAccessToken: vi.fn().mockResolvedValue("access-token"),
    });

    await request("/posts", "POST", {
      body: {
        content: "Hello",
        imageUrl: null,
        visibility: "PUBLIC",
      },
      cache: "no-store",
    });

    expect(fetch).toHaveBeenCalledWith("http://localhost:3001/posts", {
      body: JSON.stringify({
        content: "Hello",
        imageUrl: null,
        visibility: "PUBLIC",
      }),
      cache: "no-store",
      credentials: undefined,
      headers: {
        authorization: "Bearer access-token",
        "content-type": "application/json",
        "x-request-id": expect.any(String),
      },
      method: "POST",
    });
  });

  it("adds one request id to outbound requests", async () => {
    const request = createRequest({
      resolveAccessToken: vi.fn().mockResolvedValue("access-token"),
    });

    await request("/posts", "GET", {
      queryParams: {},
    });

    expect(fetch).toHaveBeenCalledWith(
      "http://localhost:3001/posts",
      expect.objectContaining({
        headers: expect.objectContaining({
          "x-request-id": expect.any(String),
        }),
      }),
    );
  });

  it("adds query params and omits nullish values", async () => {
    const request = createRequest({
      resolveAccessToken: vi.fn().mockResolvedValue("access-token"),
    });

    await request("/posts", "GET", {
      queryParams: {
        authorId: undefined,
        feed: "friends",
      },
    });

    expect(fetch).toHaveBeenCalledWith(
      "http://localhost:3001/posts?feed=friends",
      expect.objectContaining({
        method: "GET",
      }),
    );
  });

  it("throws before fetching when an authenticated server request has no token", async () => {
    const request = createRequest({
      resolveAccessToken: vi.fn().mockResolvedValue(null),
    });

    await expect(
      request("/posts", "GET", {
        queryParams: {},
      }),
    ).rejects.toBeInstanceOf(AuthRequiredError);
    expect(fetch).not.toHaveBeenCalled();
  });

  it("does not require tokens for public auth paths", async () => {
    const resolveAccessToken = vi.fn();
    const request = createRequest({ resolveAccessToken });

    await request("/auth/logout", "POST", {
      body: {
        refreshToken: "refresh-token",
      },
      auth: false,
    });

    expect(resolveAccessToken).not.toHaveBeenCalled();
    expect(fetch).toHaveBeenCalledWith(
      "http://localhost:3001/auth/logout",
      expect.objectContaining({
        headers: expect.objectContaining({
          "content-type": "application/json",
        }),
      }),
    );
  });

  it("uses relative URLs and same-origin credentials for explicit web requests", async () => {
    const request = createRequest() as (
      path: "/api/auth/logout",
      method: "POST",
      options: {
        requestType: "web";
      },
    ) => Promise<unknown>;

    await request("/api/auth/logout", "POST", {
      requestType: "web",
    });

    expect(fetch).toHaveBeenCalledWith("/api/auth/logout", {
      body: undefined,
      cache: undefined,
      credentials: "same-origin",
      headers: {
        "x-request-id": expect.any(String),
      },
      method: "POST",
    });
  });

  it("converts unauthorized authenticated server responses into auth-required errors", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(new Response(null, { status: 401 })));
    const request = createRequest({
      resolveAccessToken: vi.fn().mockResolvedValue("expired-token"),
    });

    await expect(
      request("/posts", "GET", {
        queryParams: {},
      }),
    ).rejects.toBeInstanceOf(AuthRequiredError);
  });

  it("can surface unauthorized API responses when retry handling is disabled", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(jsonResponse({ message: "Unauthorized" }, { status: 401 })));
    const request = createRequest({
      resolveAccessToken: vi.fn().mockResolvedValue("expired-token"),
    });

    await expect(
      request("/posts", "GET", {
        queryParams: {},
        retryOnUnauthorized: false,
      }),
    ).rejects.toEqual(new ApiRequestError("Unauthorized", 401));
  });

  it("retries GET requests after a network error", async () => {
    vi.useFakeTimers();
    const fetchMock = vi
      .fn()
      .mockRejectedValueOnce(new TypeError("network unavailable"))
      .mockResolvedValueOnce(jsonResponse({ id: "post-1" }));
    vi.stubGlobal("fetch", fetchMock);
    const request = createRequest({
      resolveAccessToken: vi.fn().mockResolvedValue("access-token"),
    });

    const response = request("/posts", "GET", {
      queryParams: {},
    });

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
        requestId: expect.any(String),
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
    const request = createRequest({
      resolveAccessToken: vi.fn().mockResolvedValue("access-token"),
    });

    const response = request("/posts", "GET", {
      queryParams: {},
    });

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
    const request = createRequest({
      resolveAccessToken: vi.fn().mockResolvedValue("access-token"),
    });

    const response = request("/posts", "GET", {
      queryParams: {},
    });

    await vi.advanceTimersByTimeAsync(0);
    expect(fetchMock).toHaveBeenNthCalledWith(
      1,
      "http://localhost:3001/posts",
      expect.not.objectContaining({
        signal: expect.any(AbortSignal),
      }),
    );

    await vi.advanceTimersByTimeAsync(250);
    await expect(response).resolves.toEqual({ id: "post-1" });
    expect(fetchMock).toHaveBeenNthCalledWith(
      2,
      "http://localhost:3001/posts",
      expect.objectContaining({
        signal: expect.any(AbortSignal),
      }),
    );
    expect(fetchMock.mock.calls[0]?.[1]).toMatchObject({
      headers: {
        "x-request-id": fetchMock.mock.calls[1]?.[1]?.headers["x-request-id"],
      },
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

  it("retries rate-limited responses using Retry-After capped by maxDelayMs", async () => {
    vi.useFakeTimers();
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce(
        jsonResponse(
          { message: "Too many requests" },
          {
            headers: {
              "retry-after": "10",
            },
            status: 429,
          },
        ),
      )
      .mockResolvedValueOnce(jsonResponse({ id: "post-1" }));
    vi.stubGlobal("fetch", fetchMock);
    const request = createRequest({
      resolveAccessToken: vi.fn().mockResolvedValue("access-token"),
    });

    const response = request("/posts", "GET", {
      queryParams: {},
      retry: {
        attempts: 1,
        maxDelayMs: 100,
      },
    });

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
    const request = createRequest({
      resolveAccessToken: vi.fn().mockResolvedValue("access-token"),
    });

    await expect(
      request("/posts", "GET", {
        queryParams: {},
        retry: false,
      }),
    ).rejects.toEqual(new ApiRequestError("Unavailable", 503));
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });

  it("does not retry POST requests by default", async () => {
    vi.useFakeTimers();
    const fetchMock = vi.fn().mockResolvedValue(new Response(null, { status: 503, statusText: "Unavailable" }));
    vi.stubGlobal("fetch", fetchMock);
    const request = createRequest({
      resolveAccessToken: vi.fn().mockResolvedValue("access-token"),
    });

    await expect(
      request("/posts", "POST", {
        body: {
          content: "Hello",
          imageUrl: null,
          visibility: "PUBLIC",
        },
      }),
    ).rejects.toEqual(new ApiRequestError("Unavailable", 503));
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });

  it("retries POST requests when retry is enabled", async () => {
    vi.useFakeTimers();
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce(new Response(null, { status: 503, statusText: "Unavailable" }))
      .mockResolvedValueOnce(jsonResponse({ id: "post-1" }));
    vi.stubGlobal("fetch", fetchMock);
    const request = createRequest({
      resolveAccessToken: vi.fn().mockResolvedValue("access-token"),
    });

    const response = request("/posts", "POST", {
      body: {
        content: "Hello",
        imageUrl: null,
        visibility: "PUBLIC",
      },
      retry: true,
    });

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
    const request = createRequest({
      resolveAccessToken: vi.fn().mockResolvedValue("expired-token"),
    });

    await expect(
      request("/posts", "GET", {
        queryParams: {},
      }),
    ).rejects.toBeInstanceOf(AuthRequiredError);
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });

  it("does not retry validation responses", async () => {
    vi.useFakeTimers();
    const fetchMock = vi.fn().mockResolvedValue(jsonResponse({ message: "Invalid content" }, { status: 400 }));
    vi.stubGlobal("fetch", fetchMock);
    const request = createRequest({
      resolveAccessToken: vi.fn().mockResolvedValue("access-token"),
    });

    await expect(
      request("/posts", "POST", {
        body: {
          content: "",
          imageUrl: null,
          visibility: "PUBLIC",
        },
        retry: true,
      }),
    ).rejects.toEqual(new ApiRequestError("Invalid content", 400));
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });

  it("does not retry aborted requests", async () => {
    vi.useFakeTimers();
    const abortError = new DOMException("The operation was aborted.", "AbortError");
    const fetchMock = vi.fn().mockRejectedValue(abortError);
    vi.stubGlobal("fetch", fetchMock);
    const request = createRequest({
      resolveAccessToken: vi.fn().mockResolvedValue("access-token"),
    });

    await expect(
      request("/posts", "GET", {
        queryParams: {},
      }),
    ).rejects.toBe(abortError);
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });

  it("stops after configured retry attempts and parses the final failed response", async () => {
    vi.useFakeTimers();
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce(new Response(null, { status: 503, statusText: "Unavailable" }))
      .mockResolvedValueOnce(new Response(null, { status: 503, statusText: "Unavailable" }))
      .mockResolvedValueOnce(new Response(null, { status: 503, statusText: "Unavailable" }));
    vi.stubGlobal("fetch", fetchMock);
    const request = createRequest({
      resolveAccessToken: vi.fn().mockResolvedValue("access-token"),
    });

    const response = request("/posts", "GET", {
      queryParams: {},
    });
    const assertion = expect(response).rejects.toEqual(new ApiRequestError("Unavailable", 503));

    await vi.advanceTimersByTimeAsync(250);
    await vi.advanceTimersByTimeAsync(500);
    await assertion;
    expect(fetchMock).toHaveBeenCalledTimes(3);
    expect(logger.error).toHaveBeenCalledWith(
      "api_request_failed",
      expect.objectContaining({
        attempts: 3,
        method: "GET",
        requestId: expect.any(String),
        statusCode: 503,
        url: "http://localhost:3001/posts",
      }),
    );
  });
});

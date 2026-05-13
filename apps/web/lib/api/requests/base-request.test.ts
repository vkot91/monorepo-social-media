import { beforeEach, describe, expect, it, vi } from "vitest";
import { ApiRequestError, AuthRequiredError } from "../errors";
import { appendQueryParams, createRequest, parseJsonResponse } from "./base-request";

vi.mock("#/env", () => ({
  getWebEnv: vi.fn(() => ({
    NEXT_PUBLIC_API_URL: "http://api.local",
    NODE_ENV: "test",
  })),
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
    const url = appendQueryParams(new URL("http://api.local/posts"), {
      authorId: null,
      feed: "friends",
      includeDrafts: false,
      page: 2,
      search: undefined,
    });

    expect(url.toString()).toBe("http://api.local/posts?feed=friends&includeDrafts=false&page=2");
  });
});

describe("parseJsonResponse", () => {
  it("returns null for no-content responses", async () => {
    await expect(parseJsonResponse(new Response(null, { status: 204 }))).resolves.toBeNull();
  });

  it("throws API errors using the response message when available", async () => {
    await expect(
      parseJsonResponse(jsonResponse({ message: "Nope" }, { status: 422 })),
    ).rejects.toMatchObject({
      message: "Nope",
      status: 422,
    });
  });

  it("falls back to the status text when the error body is not JSON", async () => {
    await expect(
      parseJsonResponse(new Response("not-json", { status: 503, statusText: "Unavailable" })),
    ).rejects.toEqual(new ApiRequestError("Unavailable", 503));
  });
});

describe("createRequest", () => {
  beforeEach(() => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(jsonResponse({ id: "post-1" })));
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

    expect(fetch).toHaveBeenCalledWith("http://api.local/posts", {
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
      },
      method: "POST",
    });
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
      "http://api.local/posts?feed=friends",
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
    });

    expect(resolveAccessToken).not.toHaveBeenCalled();
    expect(fetch).toHaveBeenCalledWith(
      "http://api.local/auth/logout",
      expect.objectContaining({
        headers: {
          "content-type": "application/json",
        },
      }),
    );
  });

  it("uses relative URLs and same-origin credentials for web paths", async () => {
    const request = createRequest();

    await request("/api/auth/logout", "POST", {});

    expect(fetch).toHaveBeenCalledWith("/api/auth/logout", {
      body: undefined,
      cache: undefined,
      credentials: "same-origin",
      headers: {},
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
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue(jsonResponse({ message: "Unauthorized" }, { status: 401 })),
    );
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
});

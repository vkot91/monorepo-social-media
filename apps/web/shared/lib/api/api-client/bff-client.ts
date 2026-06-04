import { parseJsonResponse } from "./response";
import type { ApiClient, BffApiRoutes, QueryValue } from "./types";
import { buildUrl } from "./url";

type PreparedBody =
  | { body: BodyInit; kind: "formData" | "json" }
  | { body: undefined; kind: "empty" };

const prepareBody = (body: unknown): PreparedBody => {
  if (body === undefined) return { body: undefined, kind: "empty" };
  if (typeof FormData !== "undefined" && body instanceof FormData) return { body, kind: "formData" };
  return { body: JSON.stringify(body), kind: "json" };
};

// Browser-side client that calls Next.js BFF routes (/api/*).
//
// Auth is handled entirely server-side: the browser sends cookies automatically
// via credentials: "same-origin", and the BFF route handler reads them to call
// the backend with a valid access token. This client never touches tokens.
//
// Retry is intentionally absent — React Query owns query retries (disabled globally),
// and mutations should not be retried transparently.
export const bffClient: ApiClient<BffApiRoutes> = async (path, method, options) => {
  const body = "body" in options ? options.body : undefined;
  const params = "params" in options ? (options.params as Record<string, boolean | number | string>) : undefined;
  const queryParams = "queryParams" in options ? (options.queryParams as Record<string, QueryValue>) : undefined;

  const url = buildUrl(path, "bff", params, queryParams);
  const preparedBody = prepareBody(body);

  const headers: Record<string, string> = {
    "x-request-id": crypto.randomUUID(),
  };

  // Do not set Content-Type for FormData — the browser sets it with the correct multipart boundary.
  if (preparedBody.kind === "json") {
    headers["content-type"] = "application/json";
  }

  const response = await fetch(url, {
    body: preparedBody.body,
    cache: options.cache,
    credentials: "same-origin",
    headers,
    method,
    signal: options.signal,
  });

  return parseJsonResponse(response);
};

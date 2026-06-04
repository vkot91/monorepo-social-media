import { getWebEnv } from "#/env";

import type { QueryValue } from "./types";

type RouteParams = Record<string, boolean | number | string>;

export const appendQueryParams = (url: URL, query?: Record<string, QueryValue>): URL => {
  for (const [key, value] of Object.entries(query ?? {})) {
    if (value !== null && value !== undefined) {
      url.searchParams.set(key, String(value));
    }
  }
  return url;
};

export const interpolatePathParams = (path: string, params?: RouteParams): string =>
  path.replace(/\{([^}]+)\}/g, (_, key: string) => {
    const value = params?.[key];

    if (value === undefined) {
      throw new Error(`Missing route param "${key}" for ${path}`);
    }

    return encodeURIComponent(String(value));
  });

export const buildUrl = (
  path: string,
  origin: "backend" | "bff",
  params?: RouteParams,
  queryParams?: Record<string, QueryValue>,
): string => {
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

  return appendQueryParams(
    new URL(interpolatedPath, getWebEnv().NEXT_PUBLIC_API_URL),
    queryParams,
  ).toString();
};

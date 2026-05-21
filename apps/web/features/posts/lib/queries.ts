"use client";

import type { ListPostsQueryInput } from "@social/contracts";
import { queryOptions } from "@tanstack/react-query";

import { bffClient } from "#/lib/api/api-client/bff-client";

import { postsKeys } from "./routes";

export const getPosts = (query: ListPostsQueryInput) =>
  bffClient("/api/posts", "GET", {
    queryParams: query,
  });

export const postsQueryOptions = (query: ListPostsQueryInput) =>
  queryOptions({
    queryFn: () => getPosts(query),
    queryKey: postsKeys.feed(query),
  });

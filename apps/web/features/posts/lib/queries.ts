"use client";

import type { ListPostsQueryInput, PaginatedPostsDto } from "@social/contracts";
import { infiniteQueryOptions, queryOptions } from "@tanstack/react-query";

import { bffClient } from "#/lib/api/api-client/bff-client";

import { postsKeys } from "./routes";

export const getPosts = (query: ListPostsQueryInput): Promise<PaginatedPostsDto> =>
  bffClient("/api/posts", "GET", {
    queryParams: query,
  });

export const postsQueryOptions = (query: ListPostsQueryInput) =>
  queryOptions({
    queryFn: () => getPosts(query),
    queryKey: postsKeys.feed(query),
  });

export const postsInfiniteQueryOptions = (query: ListPostsQueryInput) =>
  infiniteQueryOptions({
    getNextPageParam: (lastPage: PaginatedPostsDto) =>
      lastPage.pageInfo.mode === "cursor" ? (lastPage.pageInfo.nextCursor ?? undefined) : undefined,
    initialPageParam: null,
    queryFn: ({ pageParam }) =>
      getPosts({
        ...query,
        cursor: pageParam ?? undefined,
        mode: "cursor",
      }),
    queryKey: postsKeys.infiniteFeed({
      ...query,
      mode: "cursor",
    }),
  });

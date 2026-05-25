import type { CreatePostInput, ListPostsQueryInput, PaginatedPostsDto, PostDto } from "@social/contracts";

import type { ApiRoute } from "#/shared/lib/api/types";

export type PostsBackendApiRoutes = {
  "/posts": {
    GET: ApiRoute<{
      queryParams: ListPostsQueryInput;
      response: PaginatedPostsDto;
    }>;
    POST: ApiRoute<{
      body: CreatePostInput;
      response: PostDto;
    }>;
  };
};

export type PostsBffApiRoutes = {
  "/api/posts": {
    GET: ApiRoute<{
      queryParams: ListPostsQueryInput;
      response: PaginatedPostsDto;
    }>;
    POST: ApiRoute<{
      body: CreatePostInput;
      response: PostDto;
    }>;
  };
};

export const postsKeys = {
  all: ["posts"] as const,
  feed: (query: ListPostsQueryInput) => [...postsKeys.all, "feed", query] as const,
  infiniteFeed: (query: ListPostsQueryInput) => [...postsKeys.all, "infinite-feed", query] as const,
};

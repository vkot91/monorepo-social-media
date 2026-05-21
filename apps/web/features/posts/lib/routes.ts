import type { CreatePostInput, ListPostsQueryInput, PostDto } from "@social/contracts";

import type { ApiRoute } from "#/lib/api/types";

export type PostsBackendApiRoutes = {
  "/posts": {
    GET: ApiRoute<{
      queryParams: ListPostsQueryInput;
      response: PostDto[];
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
      response: PostDto[];
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
};

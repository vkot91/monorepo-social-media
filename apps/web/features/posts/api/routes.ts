import type {
  ListPostsQueryInput,
  PaginatedPostsDto,
  PostDto,
} from "@social/contracts";

import type { ApiRoute } from "#/shared/lib/api/types";

export type PostsBackendApiRoutes = {
  "/posts": {
    GET: ApiRoute<{
      queryParams: ListPostsQueryInput;
      response: PaginatedPostsDto;
    }>;
    POST: ApiRoute<{
      body: FormData;
      response: PostDto;
    }>;
  };
  "/posts/{id}": {
    DELETE: ApiRoute<{
      params: {
        id: string;
      };
      response: null;
    }>;
    PATCH: ApiRoute<{
      body: FormData;
      params: {
        id: string;
      };
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
      body: FormData;
      response: PostDto;
    }>;
  };
  "/api/posts/{id}": {
    DELETE: ApiRoute<{
      params: {
        id: string;
      };
      response: null;
    }>;
    PATCH: ApiRoute<{
      body: FormData;
      params: {
        id: string;
      };
      response: PostDto;
    }>;
  };
};

export const postsKeys = {
  infiniteFeedRoot: ["posts", "infinite-feed"] as const,
  infiniteFeed: (query: ListPostsQueryInput) => [...postsKeys.infiniteFeedRoot, query] as const,
};

export const postMutationKeys = {
  create: ["posts", "create"] as const,
};

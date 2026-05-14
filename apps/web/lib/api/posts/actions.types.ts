import { CreatePostInput, ListPostsQueryInput, PostDto } from "@social/contracts";

import { ApiRoute } from "../types";

export type PostsApiRoutes = {
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

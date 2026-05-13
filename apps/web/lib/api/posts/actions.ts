import "server-only";

import type { CreatePostInput, ListPostsQueryInput } from "@social/contracts";
import { serverRequest } from "../requests/server-request";

export const postsApi = {
  async create(input: CreatePostInput) {
    return serverRequest("/posts", "POST", {
      body: input,
    });
  },

  async list(query: ListPostsQueryInput = {}) {
    return serverRequest("/posts", "GET", {
      queryParams: {
        authorId: query.authorId,
        feed: query.feed,
      },
    });
  },
};

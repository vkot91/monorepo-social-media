import "server-only";

import { PostFeed } from "@social/contracts";
import { redirect } from "next/navigation";

import { serverRequest } from "../requests/server-request";
import { ApiRequestError, AuthRequiredError } from "../utils/errors";

export const getPosts = async (feedType: PostFeed) => {
  try {
    const posts = await serverRequest("/posts", "GET", {
      queryParams: {
        feed: feedType,
      },
      retry: {
        attempts: 3,
      },
    });

    return {
      posts,
      status: "success" as const,
    };
  } catch (error) {
    if (error instanceof AuthRequiredError) {
      redirect("/login");
    }

    return {
      message: error instanceof ApiRequestError ? error.message : "Feed is temporarily unavailable.",
      status: "error" as const,
    };
  }
};

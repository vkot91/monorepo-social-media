import { createPostSchema, listPostsQuerySchema } from "@social/contracts";
import { NextResponse } from "next/server";

import { backendClient } from "#/shared/lib/api/api-client/backend-client";
import { apiErrorResponse, parseJsonBody, zodValidationErrorResponse } from "#/shared/lib/api/api-client/route-handler";

export const GET = async (request: Request) => {
  const url = new URL(request.url);
  const input = listPostsQuerySchema.safeParse({
    authorId: url.searchParams.get("authorId") ?? undefined,
    cursor: url.searchParams.get("cursor") ?? undefined,
    feed: url.searchParams.get("feed") ?? undefined,
    limit: url.searchParams.get("limit") ?? undefined,
    mode: url.searchParams.get("mode") ?? undefined,
    page: url.searchParams.get("page") ?? undefined,
  });

  if (!input.success) {
    return zodValidationErrorResponse("Please check the posts query and try again.", input.error);
  }

  try {
    return NextResponse.json(
      await backendClient("/posts", "GET", {
        queryParams: input.data,
      }),
    );
  } catch (error) {
    return apiErrorResponse(error, "Feed is temporarily unavailable.");
  }
};

export const POST = async (request: Request) => {
  const input = createPostSchema.safeParse(await parseJsonBody(request));

  if (!input.success) {
    return zodValidationErrorResponse("Please check your post and try again.", input.error);
  }

  try {
    return NextResponse.json(await backendClient("/posts", "POST", { body: input.data }));
  } catch (error) {
    return apiErrorResponse(error, "Post creation is unavailable right now.");
  }
};

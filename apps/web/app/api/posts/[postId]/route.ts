import { updatePostSchema } from "@social/contracts";
import { NextResponse } from "next/server";

import { backendClient } from "#/shared/lib/api/api-client/backend-client";
import { apiErrorResponse, parseJsonBody, zodValidationErrorResponse } from "#/shared/lib/api/api-client/route-handler";

type PostRouteContext = {
  params: Promise<{
    postId: string;
  }>;
};

export const PATCH = async (request: Request, context: PostRouteContext) => {
  const { postId } = await context.params;
  const input = updatePostSchema.safeParse(await parseJsonBody(request));

  if (!input.success) {
    return zodValidationErrorResponse("Please check your post and try again.", input.error);
  }

  try {
    return NextResponse.json(
      await backendClient("/posts/{id}", "PATCH", {
        body: input.data,
        params: {
          id: postId,
        },
      }),
    );
  } catch (error) {
    return apiErrorResponse(error, "Post update is unavailable right now.");
  }
};

export const DELETE = async (_request: Request, context: PostRouteContext) => {
  const { postId } = await context.params;

  try {
    await backendClient("/posts/{id}", "DELETE", {
      params: {
        id: postId,
      },
    });

    return new NextResponse(null, {
      status: 204,
    });
  } catch (error) {
    return apiErrorResponse(error, "Post removal is unavailable right now.");
  }
};

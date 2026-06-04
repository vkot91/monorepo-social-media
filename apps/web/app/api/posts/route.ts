import { listPostsQuerySchema } from "@social/contracts";
import { NextResponse } from "next/server";

import { backendClient } from "#/shared/lib/api/api-client/backend-client";
import {
  apiErrorResponse,
  parseQueryParams,
  zodValidationErrorResponse,
} from "#/shared/lib/api/api-client/route-handler";

export const GET = async (request: Request) => {
  const input = parseQueryParams(request, listPostsQuerySchema);

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
  try {
    return NextResponse.json(await backendClient("/posts", "POST", { body: await request.formData() }));
  } catch (error) {
    return apiErrorResponse(error, "Post creation is unavailable right now.");
  }
};

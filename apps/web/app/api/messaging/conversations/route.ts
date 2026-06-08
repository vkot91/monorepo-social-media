import { startConversationSchema } from "@social/contracts";
import { NextResponse } from "next/server";

import { backendClient } from "#/shared/lib/api/api-client/backend-client";
import { apiErrorResponse, zodValidationErrorResponse } from "#/shared/lib/api/api-client/route-handler";

export const GET = async () => {
  try {
    return NextResponse.json(await backendClient("/conversations", "GET", {}));
  } catch (error) {
    return apiErrorResponse(error, "Conversations are temporarily unavailable.");
  }
};

export const POST = async (request: Request) => {
  const parsed = startConversationSchema.safeParse(await request.json());

  if (!parsed.success) {
    return zodValidationErrorResponse("Please pick a valid recipient.", parsed.error);
  }

  try {
    return NextResponse.json(await backendClient("/conversations", "POST", { body: parsed.data }));
  } catch (error) {
    return apiErrorResponse(error, "Starting a conversation is unavailable right now.");
  }
};

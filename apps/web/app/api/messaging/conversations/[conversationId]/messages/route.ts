import { listMessagesQuerySchema, sendMessageSchema } from "@social/contracts";
import { NextResponse } from "next/server";

import { backendClient } from "#/shared/lib/api/api-client/backend-client";
import {
  apiErrorResponse,
  parseQueryParams,
  zodValidationErrorResponse,
} from "#/shared/lib/api/api-client/route-handler";

type Context = { params: Promise<{ conversationId: string }> };

export const GET = async (request: Request, context: Context) => {
  const { conversationId } = await context.params;
  const input = parseQueryParams(request, listMessagesQuerySchema);

  if (!input.success) {
    return zodValidationErrorResponse("Please check the messages query.", input.error);
  }

  try {
    return NextResponse.json(
      await backendClient("/conversations/{id}/messages", "GET", {
        params: { id: conversationId },
        queryParams: input.data,
      }),
    );
  } catch (error) {
    return apiErrorResponse(error, "Messages are temporarily unavailable.");
  }
};

export const POST = async (request: Request, context: Context) => {
  const { conversationId } = await context.params;
  const parsed = sendMessageSchema.safeParse(await request.json());

  if (!parsed.success) {
    return zodValidationErrorResponse("Please type a message.", parsed.error);
  }

  try {
    return NextResponse.json(
      await backendClient("/conversations/{id}/messages", "POST", {
        body: parsed.data,
        params: { id: conversationId },
      }),
    );
  } catch (error) {
    return apiErrorResponse(error, "Sending the message is unavailable right now.");
  }
};

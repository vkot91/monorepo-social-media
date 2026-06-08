import { NextResponse } from "next/server";

import { backendClient } from "#/shared/lib/api/api-client/backend-client";
import { apiErrorResponse } from "#/shared/lib/api/api-client/route-handler";

type Context = { params: Promise<{ conversationId: string }> };

export const POST = async (_request: Request, context: Context) => {
  const { conversationId } = await context.params;

  try {
    return NextResponse.json(
      await backendClient("/conversations/{id}/read", "POST", { params: { id: conversationId } }),
    );
  } catch (error) {
    return apiErrorResponse(error, "Marking messages read is unavailable right now.");
  }
};

import { NextResponse } from "next/server";

import { backendClient } from "#/shared/lib/api/api-client/backend-client";
import { apiErrorResponse } from "#/shared/lib/api/api-client/route-handler";

type Context = { params: Promise<{ messageId: string }> };

export const DELETE = async (_request: Request, context: Context) => {
  const { messageId } = await context.params;

  try {
    return NextResponse.json(
      await backendClient("/messages/{id}", "DELETE", { params: { id: messageId } }),
    );
  } catch (error) {
    return apiErrorResponse(error, "Deleting the message is unavailable right now.");
  }
};

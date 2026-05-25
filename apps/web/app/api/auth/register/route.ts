import { registerSchema } from "@social/contracts";
import { NextResponse } from "next/server";

import { backendClient } from "#/shared/lib/api/api-client/backend-client";
import { apiErrorResponse, parseJsonBody, zodValidationErrorResponse } from "#/shared/lib/api/api-client/route-handler";
import { persistAuthSession } from "#/shared/lib/api/auth/session";

export const POST = async (request: Request) => {
  const input = registerSchema.safeParse(await parseJsonBody(request));

  if (!input.success) {
    return zodValidationErrorResponse("Please check the registration fields.", input.error);
  }

  try {
    const response = await backendClient("/auth/register", "POST", { body: input.data, auth: false });

    await persistAuthSession(response);

    return NextResponse.json(null);
  } catch (error) {
    return apiErrorResponse(error, "Registration is unavailable right now.");
  }
};

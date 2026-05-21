import { loginSchema } from "@social/contracts";
import { NextResponse } from "next/server";

import { backendClient } from "#/lib/api/api-client/backend-client";
import { apiErrorResponse, parseJsonBody, zodValidationErrorResponse } from "#/lib/api/api-client/route-handler";
import { persistAuthSession } from "#/lib/api/auth/session";

export const POST = async (request: Request) => {
  const input = loginSchema.safeParse(await parseJsonBody(request));

  if (!input.success) {
    return zodValidationErrorResponse("Enter a valid email and password.", input.error);
  }

  try {
    const response = await backendClient("/auth/login", "POST", {
      body: input.data,
      auth: false,
    });

    await persistAuthSession(response);

    return NextResponse.json(null);
  } catch (error) {
    return apiErrorResponse(error, "Login is unavailable right now.");
  }
};

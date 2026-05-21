import { NextResponse } from "next/server";

import { backendClient } from "#/lib/api/api-client/backend-client";
import { apiErrorResponse } from "#/lib/api/api-client/route-handler";
import { getRefreshToken } from "#/lib/api/auth/cookies";
import { persistAuthSession } from "#/lib/api/auth/session";
import { AuthRequiredError } from "#/lib/api/utils/errors";

export const POST = async () => {
  const refreshToken = await getRefreshToken();

  try {
    if (!refreshToken) {
      throw new AuthRequiredError();
    }

    const response = await backendClient("/auth/refresh", "POST", {
      body: { refreshToken },
      auth: false,
    });

    await persistAuthSession(response);

    return NextResponse.json(null);
  } catch (error) {
    return apiErrorResponse(error, "Session refresh is unavailable right now.");
  }
};

import { NextResponse } from "next/server";

import { backendClient } from "#/shared/lib/api/api-client/backend-client";
import { apiErrorResponse } from "#/shared/lib/api/api-client/route-handler";
import { clearAuthCookies, getRefreshToken } from "#/shared/lib/api/auth/cookies";

export const POST = async () => {
  const refreshToken = await getRefreshToken();

  try {
    if (refreshToken) {
      await backendClient("/auth/logout", "POST", {
        body: { refreshToken },
      });
    }

    await clearAuthCookies();

    return NextResponse.json(null);
  } catch (error) {
    return apiErrorResponse(error, "Logout is unavailable right now.");
  }
};

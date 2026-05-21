import { NextResponse } from "next/server";

import { backendClient } from "#/lib/api/api-client/backend-client";
import { apiErrorResponse } from "#/lib/api/api-client/route-handler";

export const GET = async () => {
  try {
    const user = await backendClient("/auth/me", "GET", {});
    return NextResponse.json(user);
  } catch (error) {
    return apiErrorResponse(error, "Profile is unavailable right now.");
  }
};

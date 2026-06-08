import { NextResponse } from "next/server";

import { backendClient } from "#/shared/lib/api/api-client/backend-client";
import { apiErrorResponse } from "#/shared/lib/api/api-client/route-handler";
import { getAccessToken } from "#/shared/lib/api/auth/cookies";

// Returns a short-lived access token for the socket.io handshake.
// Runs server-side: a lightweight authenticated call forces backendClient's
// refresh-on-401 flow (persisting fresh cookies if needed), then we read the
// resulting access token. Refresh tokens stay httpOnly and never leave the BFF.
export const GET = async () => {
  try {
    await backendClient("/auth/me", "GET", {});

    const token = await getAccessToken();

    if (!token) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    return NextResponse.json({ token });
  } catch (error) {
    return apiErrorResponse(error, "Realtime token is unavailable right now.");
  }
};

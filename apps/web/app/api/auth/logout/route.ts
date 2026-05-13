import { NextResponse } from "next/server";
import { clearAuthCookies, getRefreshToken } from "#/lib/api/auth/cookies";
import { authServerApi } from "#/lib/api/auth/server-actions";

export async function POST() {
  const refreshToken = await getRefreshToken();

  if (refreshToken) {
    await authServerApi.logout({ refreshToken }).catch(() => undefined);
  }

  await clearAuthCookies();

  return NextResponse.json({ ok: true });
}

import type { AuthResponse } from "@social/contracts";
import { setAuthCookies } from "#/lib/api/auth/cookies";

export async function persistAuthSession(response: AuthResponse) {
  await setAuthCookies({
    accessToken: response.accessToken,
    refreshToken: response.refreshToken,
  });
}

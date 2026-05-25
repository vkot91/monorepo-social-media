import type { AuthTokens } from "@social/contracts";
import { cookies } from "next/headers";

export const accessTokenCookieName = "social_access_token";
export const refreshTokenCookieName = "social_refresh_token";

const isProduction = process.env.NODE_ENV === "production";

const authCookieOptions = {
  httpOnly: true,
  sameSite: "lax" as const,
  secure: isProduction,
};

export async function setAuthCookies(tokens: AuthTokens) {
  const cookieStore = await cookies();

  cookieStore.set(accessTokenCookieName, tokens.accessToken, {
    ...authCookieOptions,
    maxAge: 60 * 15,
    path: "/",
  });
  cookieStore.set(refreshTokenCookieName, tokens.refreshToken, {
    ...authCookieOptions,
    maxAge: 60 * 60 * 24 * 30,
    path: "/",
  });
}

export async function clearAuthCookies() {
  const cookieStore = await cookies();

  cookieStore.delete(accessTokenCookieName);
  cookieStore.delete(refreshTokenCookieName);
}

export async function getAccessToken() {
  return (await cookies()).get(accessTokenCookieName)?.value ?? null;
}

export async function getRefreshToken() {
  return (await cookies()).get(refreshTokenCookieName)?.value ?? null;
}

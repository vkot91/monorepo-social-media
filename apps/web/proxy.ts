import { NextResponse, type NextRequest } from "next/server";

const accessTokenCookieName = "social_access_token";
const refreshTokenCookieName = "social_refresh_token";
const apiUrl = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3001";

type RefreshResponse = {
  accessToken: string;
  refreshToken: string;
};

function isJwtExpired(token: string) {
  const [, payload] = token.split(".");

  if (!payload) {
    return true;
  }

  try {
    const parsed = JSON.parse(atob(payload.replace(/-/g, "+").replace(/_/g, "/"))) as {
      exp?: unknown;
    };

    if (typeof parsed.exp !== "number") {
      return true;
    }

    return parsed.exp * 1000 <= Date.now() + 30_000;
  } catch {
    return true;
  }
}

function redirectToLogin(request: NextRequest) {
  const loginUrl = new URL("/login", request.url);
  loginUrl.searchParams.set("next", request.nextUrl.pathname);
  const response = NextResponse.redirect(loginUrl);

  response.cookies.delete(accessTokenCookieName);
  response.cookies.delete(refreshTokenCookieName);

  return response;
}

function redirectToFeed(request: NextRequest) {
  return NextResponse.redirect(new URL("/feed", request.url));
}

function isAuthPage(pathname: string) {
  return pathname === "/login" || pathname === "/register";
}

export async function proxy(request: NextRequest) {
  const isRequestForAuthPage = isAuthPage(request.nextUrl.pathname);
  const accessToken = request.cookies.get(accessTokenCookieName)?.value ?? null;
  const refreshToken = request.cookies.get(refreshTokenCookieName)?.value ?? null;

  if (!refreshToken) {
    return isRequestForAuthPage ? NextResponse.next() : redirectToLogin(request);
  }

  if (accessToken && !isJwtExpired(accessToken)) {
    return isRequestForAuthPage ? redirectToFeed(request) : NextResponse.next();
  }

  const refreshResponse = await fetch(new URL("/auth/refresh", apiUrl), {
    body: JSON.stringify({ refreshToken }),
    headers: {
      "content-type": "application/json",
    },
    method: "POST",
  }).catch(() => null);

  if (!refreshResponse?.ok) {
    return isRequestForAuthPage ? NextResponse.next() : redirectToLogin(request);
  }

  const tokens = (await refreshResponse.json()) as RefreshResponse;
  const response = isRequestForAuthPage ? redirectToFeed(request) : NextResponse.next();

  response.cookies.set(accessTokenCookieName, tokens.accessToken, {
    httpOnly: true,
    maxAge: 60 * 15,
    path: "/",
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
  });
  response.cookies.set(refreshTokenCookieName, tokens.refreshToken, {
    httpOnly: true,
    maxAge: 60 * 60 * 24 * 30,
    path: "/",
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
  });

  return response;
}

export const config = {
  matcher: ["/feed/:path*", "/login", "/register"],
};

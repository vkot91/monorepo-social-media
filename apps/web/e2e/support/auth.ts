import type { BrowserContext } from "@playwright/test";

const accessTokenCookieName = "social_access_token";
const refreshTokenCookieName = "social_refresh_token";

export const authScenarios = ["empty", "posts", "unavailable"] as const;

type AuthScenario = (typeof authScenarios)[number];

const base64UrlEncode = (input: object) =>
  Buffer.from(JSON.stringify(input)).toString("base64url");

export const createAccessToken = (scenario: AuthScenario = "posts") => {
  const exp = Math.floor(Date.now() / 1000) + 60 * 60;

  return `e2e.${base64UrlEncode({ exp, scenario })}.signature`;
};

export const authenticate = async (
  context: BrowserContext,
  baseURL: string,
  scenario: AuthScenario = "posts",
) => {
  await context.addCookies([
    {
      httpOnly: true,
      name: accessTokenCookieName,
      sameSite: "Lax",
      url: baseURL,
      value: createAccessToken(scenario),
    },
    {
      httpOnly: true,
      name: refreshTokenCookieName,
      sameSite: "Lax",
      url: baseURL,
      value: "refresh-token",
    },
  ]);
};

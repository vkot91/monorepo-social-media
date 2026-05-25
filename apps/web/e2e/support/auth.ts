import type { BrowserContext } from "@playwright/test";
import { testUsers } from "@social/database";

import { e2eConfig } from "../config";

const accessTokenCookieName = "social_access_token";
const refreshTokenCookieName = "social_refresh_token";

const testAccounts = {
  empty: {
    email: testUsers.empty.email,
    password: "password123",
  },
  posts: {
    email: testUsers.login.email,
    password: "password123",
  },
} as const;

type TestAccount = keyof typeof testAccounts;

const getAuthTokens = async (account: TestAccount) => {
  const response = await fetch(`${e2eConfig.apiURL}/auth/login`, {
    body: JSON.stringify(testAccounts[account]),
    headers: {
      "content-type": "application/json",
    },
    method: "POST",
  });

  if (!response.ok) {
    throw new Error(`Failed to authenticate ${account} test account.`);
  }

  return (await response.json()) as {
    accessToken: string;
    refreshToken: string;
  };
};

export const authenticate = async (context: BrowserContext, baseURL: string, account: TestAccount = "posts") => {
  const tokens = await getAuthTokens(account);

  await context.addCookies([
    {
      httpOnly: true,
      name: accessTokenCookieName,
      sameSite: "Lax",
      url: baseURL,
      value: tokens.accessToken,
    },
    {
      httpOnly: true,
      name: refreshTokenCookieName,
      sameSite: "Lax",
      url: baseURL,
      value: tokens.refreshToken,
    },
  ]);
};

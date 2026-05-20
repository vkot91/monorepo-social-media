import type { BrowserContext } from "@playwright/test";

const accessTokenCookieName = "social_access_token";
const refreshTokenCookieName = "social_refresh_token";

const apiPort = process.env.PLAYWRIGHT_API_PORT ?? "3210";
const apiURL = process.env.NEXT_PUBLIC_API_URL ?? `http://127.0.0.1:${apiPort}`;

const testAccounts = {
  empty: {
    email: "empty@example.com",
    password: "password123",
  },
  posts: {
    email: "maya@example.com",
    password: "password123",
  },
} as const;

type TestAccount = keyof typeof testAccounts;

const getAuthTokens = async (account: TestAccount) => {
  const response = await fetch(`${apiURL}/auth/login`, {
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

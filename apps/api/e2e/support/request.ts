import { testUsers } from "@social/database";

type JsonResponse<TBody> = {
  body: TBody;
  response: Response;
};

export const makeRequest =
  (baseUrl: string) =>
  async <TBody = unknown>(path: string, init: RequestInit = {}): Promise<JsonResponse<TBody>> => {
    const response = await fetch(`${baseUrl}${path}`, {
      ...init,
      headers: {
        ...(typeof init.body === "string" ? { "content-type": "application/json" } : {}),
        ...init.headers,
      },
    });
    const text = await response.text();

    return { body: (text ? JSON.parse(text) : null) as TBody, response };
  };

export type RequestFn = ReturnType<typeof makeRequest>;

export async function loginAs(
  request: RequestFn,
  email: string = testUsers.login.email,
  password = "password123",
): Promise<{ accessToken: string; refreshToken: string }> {
  const { body, response } = await request<{ accessToken: string; refreshToken: string }>("/auth/login", {
    body: JSON.stringify({ email, password }),
    method: "POST",
  });

  if (response.status !== 200) {
    throw new Error(`Login failed for ${email}: HTTP ${response.status}`);
  }

  return body;
}

import { type INestApplication } from "@nestjs/common";
import { Reflector } from "@nestjs/core";
import { Test } from "@nestjs/testing";
import type { PaginatedPostsDto } from "@social/contracts";
import { prisma, testPosts, testUsers } from "@social/database";

import { HttpExceptionFilter } from "#common/filters/http-exception.filter";
import { RequestLoggingInterceptor } from "#common/interceptors/request-logging.interceptor";
import { TimeoutInterceptor } from "#common/interceptors/timeout.interceptor";
import { LoggingService } from "#common/logging/logging.service";

import { AppModule } from "./app.module";

type JsonResponse<TBody = unknown> = {
  body: TBody;
  response: Response;
};

let app: INestApplication;
let baseUrl: string;

async function request<TBody = unknown>(path: string, init: RequestInit = {}): Promise<JsonResponse<TBody>> {
  const response = await fetch(`${baseUrl}${path}`, {
    ...init,
    headers: {
      ...(init.body ? { "content-type": "application/json" } : {}),
      ...init.headers,
    },
  });
  const text = await response.text();

  return {
    body: (text ? JSON.parse(text) : null) as TBody,
    response,
  };
}

async function login(email = testUsers.login.email, password = "password123") {
  const { body, response } = await request<{ accessToken: string; refreshToken: string }>("/auth/login", {
    body: JSON.stringify({ email, password }),
    method: "POST",
  });

  expect(response.status).toBe(200);

  return body;
}

beforeAll(async () => {
  const module = await Test.createTestingModule({
    imports: [AppModule],
  }).compile();

  app = module.createNestApplication();
  const loggingService = app.get(LoggingService);

  app.useGlobalFilters(new HttpExceptionFilter(loggingService));
  app.useGlobalInterceptors(new RequestLoggingInterceptor(loggingService), new TimeoutInterceptor(app.get(Reflector)));
  app.enableCors({
    credentials: true,
    origin: process.env.CORS_ORIGIN,
  });

  await app.listen(0, "127.0.0.1");
  baseUrl = await app.getUrl();
});

afterAll(async () => {
  await app.close();
  await prisma.$disconnect();
});

describe("API e2e", () => {
  it("returns health status", async () => {
    const { body, response } = await request<{ status: string }>("/health");

    expect(response.status).toBe(200);
    expect(body).toEqual({
      name: "social-media-api",
      status: "ok",
    });
  });

  it("registers a user and persists a refresh token", async () => {
    const { body, response } = await request<{ accessToken: string; refreshToken: string }>("/auth/register", {
      body: JSON.stringify({
        displayName: "New User",
        email: "new-user@example.com",
        password: "password123",
        username: "new_user",
      }),
      method: "POST",
    });

    expect(response.status).toBe(201);
    expect(body.accessToken).toEqual(expect.any(String));
    expect(body.refreshToken).toEqual(expect.any(String));
    await expect(
      prisma.user.findUnique({
        where: {
          email: "new-user@example.com",
        },
      }),
    ).resolves.toMatchObject({
      username: "new_user",
    });
    await expect(
      prisma.refreshToken.count({
        where: {
          user: {
            email: "new-user@example.com",
          },
        },
      }),
    ).resolves.toBe(1);
  });

  it("rejects duplicate registration", async () => {
    const { body, response } = await request<{ message: string }>("/auth/register", {
      body: JSON.stringify({
        displayName: "Taken Account",
        email: testUsers.taken.email,
        password: "password123",
        username: "another_taken",
      }),
      method: "POST",
    });

    expect(response.status).toBe(409);
    expect(body.message).toBe("Email or username is already in use");
  });

  it("logs in with a seeded user", async () => {
    const tokens = await login();

    expect(tokens.accessToken).toEqual(expect.any(String));
    expect(tokens.refreshToken).toEqual(expect.any(String));
  });

  it("rejects an invalid password", async () => {
    const { body, response } = await request<{ message: string }>("/auth/login", {
      body: JSON.stringify({
        email: testUsers.login.email,
        password: "wrong-password",
      }),
      method: "POST",
    });

    expect(response.status).toBe(401);
    expect(body.message).toBe("Invalid email or password");
  });

  it("returns the authenticated user", async () => {
    const { accessToken } = await login();
    const { body, response } = await request("/auth/me", {
      headers: {
        authorization: `Bearer ${accessToken}`,
      },
    });

    expect(response.status).toBe(200);
    expect(body).toMatchObject({
      email: testUsers.login.email,
      id: testUsers.login.id,
      username: testUsers.login.username,
    });
  });

  it("lists and creates posts", async () => {
    const { accessToken } = await login();
    const authHeaders = {
      authorization: `Bearer ${accessToken}`,
    };
    const initialPosts = await request<PaginatedPostsDto>("/posts?feed=all&limit=20", {
      headers: authHeaders,
    });

    expect(initialPosts.response.status).toBe(200);
    expect(initialPosts.body.items).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          content: testPosts.mayaFeed.content,
        }),
      ]),
    );
    expect(initialPosts.body.pageInfo).toMatchObject({
      hasNextPage: true,
      limit: 20,
      mode: "cursor",
    });

    if (initialPosts.body.pageInfo.mode !== "cursor" || !initialPosts.body.pageInfo.nextCursor) {
      throw new Error("Expected the first posts page to include a next cursor.");
    }

    const lastSeedPost = testPosts.mayaFeedPage.at(-1);

    if (!lastSeedPost) {
      throw new Error("Expected seeded posts fixture to include a final cursor page post.");
    }

    const nextPosts = await request<PaginatedPostsDto>(
      `/posts?feed=all&limit=20&cursor=${encodeURIComponent(initialPosts.body.pageInfo.nextCursor)}`,
      {
        headers: authHeaders,
      },
    );

    expect(nextPosts.response.status).toBe(200);
    expect(nextPosts.body).toMatchObject({
      items: [
        expect.objectContaining({
          content: lastSeedPost.content,
        }),
      ],
      pageInfo: {
        hasNextPage: false,
        limit: 20,
        mode: "cursor",
        nextCursor: null,
      },
    });

    const createdPost = await request<{ content: string }>("/posts", {
      body: JSON.stringify({
        content: testPosts.createdPost.content,
      }),
      headers: authHeaders,
      method: "POST",
    });

    expect(createdPost.response.status).toBe(201);
    expect(createdPost.body).toMatchObject({
      content: testPosts.createdPost.content,
    });

    await expect(
      prisma.post.count({
        where: {
          authorId: testUsers.login.id,
        },
      }),
    ).resolves.toBe(testPosts.mayaFeedPage.length + 1);
  });
});

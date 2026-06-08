import type { INestApplication } from "@nestjs/common";
import { prisma, testUsers } from "@social/database";

import { closeTestApp, createTestApp } from "#e2e/support/create-app";
import { loginAs, makeRequest, type RequestFn } from "#e2e/support/request";

let app: INestApplication;
let request: RequestFn;

beforeAll(async () => {
  app = await createTestApp();
  request = makeRequest(await app.getUrl());
});

afterAll(async () => {
  await closeTestApp(app);
});

describe("auth", () => {
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
      prisma.user.findUnique({ where: { email: "new-user@example.com" } }),
    ).resolves.toMatchObject({ username: "new_user" });
    await expect(
      prisma.refreshToken.count({ where: { user: { email: "new-user@example.com" } } }),
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
    const tokens = await loginAs(request);

    expect(tokens.accessToken).toEqual(expect.any(String));
    expect(tokens.refreshToken).toEqual(expect.any(String));
  });

  it("rejects an invalid password", async () => {
    const { body, response } = await request<{ message: string }>("/auth/login", {
      body: JSON.stringify({ email: testUsers.login.email, password: "wrong-password" }),
      method: "POST",
    });

    expect(response.status).toBe(401);
    expect(body.message).toBe("Invalid email or password");
  });

  it("returns the authenticated user", async () => {
    const { accessToken } = await loginAs(request);
    const { body, response } = await request("/auth/me", {
      headers: { authorization: `Bearer ${accessToken}` },
    });

    expect(response.status).toBe(200);
    expect(body).toMatchObject({
      email: testUsers.login.email,
      id: testUsers.login.id,
      username: testUsers.login.username,
    });
  });

  it("refreshes tokens using a valid refresh token", async () => {
    const { refreshToken } = await loginAs(request);
    const { body, response } = await request<{ accessToken: string; refreshToken: string }>("/auth/refresh", {
      body: JSON.stringify({ refreshToken }),
      method: "POST",
    });

    expect(response.status).toBe(200);
    expect(body.accessToken).toEqual(expect.any(String));
    expect(body.refreshToken).toEqual(expect.any(String));
  });

  it("rejects refresh requests with an invalid token", async () => {
    const { response } = await request("/auth/refresh", {
      body: JSON.stringify({ refreshToken: "not-a-valid-token" }),
      method: "POST",
    });

    expect(response.status).toBe(401);
  });

  it("logs out and invalidates the refresh token", async () => {
    const { accessToken, refreshToken } = await loginAs(request);

    const logoutResponse = await request("/auth/logout", {
      body: JSON.stringify({ refreshToken }),
      headers: { authorization: `Bearer ${accessToken}` },
      method: "POST",
    });

    expect(logoutResponse.response.status).toBe(204);

    const secondRefresh = await request("/auth/refresh", {
      body: JSON.stringify({ refreshToken }),
      method: "POST",
    });

    expect(secondRefresh.response.status).toBe(401);
  });
});

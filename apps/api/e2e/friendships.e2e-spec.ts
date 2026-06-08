import type { INestApplication } from "@nestjs/common";
import { testUsers } from "@social/database";

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

describe("friendships", () => {
  it("sends and accepts a friendship request", async () => {
    const senderTokens = await loginAs(request, testUsers.login.email);
    const receiverTokens = await loginAs(request, testUsers.empty.email);
    const senderHeaders = { authorization: `Bearer ${senderTokens.accessToken}` };
    const receiverHeaders = { authorization: `Bearer ${receiverTokens.accessToken}` };

    const sendResponse = await request<{ id: string; status: string }>("/friendships/requests", {
      body: JSON.stringify({ targetUserId: testUsers.empty.id }),
      headers: senderHeaders,
      method: "POST",
    });

    expect(sendResponse.response.status).toBe(201);
    expect(sendResponse.body.status).toBe("PENDING");

    const friendshipId = sendResponse.body.id;
    const acceptResponse = await request<{ id: string; status: string }>(`/friendships/requests/${friendshipId}`, {
      body: JSON.stringify({ status: "ACCEPTED" }),
      headers: receiverHeaders,
      method: "PATCH",
    });

    expect(acceptResponse.response.status).toBe(200);
    expect(acceptResponse.body.status).toBe("ACCEPTED");
  });
});

import type { INestApplication } from "@nestjs/common";
import type { ConversationDto, MessageDto, PaginatedMessagesDto } from "@social/contracts";
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

describe("messaging", () => {
  it("starts a conversation and lists it", async () => {
    const { accessToken } = await loginAs(request, testUsers.login.email);
    const authHeaders = { authorization: `Bearer ${accessToken}` };

    const startResponse = await request<ConversationDto>("/conversations", {
      body: JSON.stringify({ recipientId: testUsers.taken.id }),
      headers: authHeaders,
      method: "POST",
    });

    expect(startResponse.response.status).toBe(201);
    expect(startResponse.body).toMatchObject({
      id: expect.any(String),
      participant: expect.objectContaining({ id: testUsers.taken.id }),
      unreadCount: 0,
    });

    const conversationId = startResponse.body.id;

    const listResponse = await request<ConversationDto[]>("/conversations", { headers: authHeaders });

    expect(listResponse.response.status).toBe(200);
    expect(listResponse.body).toEqual(
      expect.arrayContaining([expect.objectContaining({ id: conversationId })]),
    );
  });

  it("starting the same conversation twice returns the existing one", async () => {
    const { accessToken } = await loginAs(request, testUsers.login.email);
    const authHeaders = { authorization: `Bearer ${accessToken}` };

    const first = await request<ConversationDto>("/conversations", {
      body: JSON.stringify({ recipientId: testUsers.taken.id }),
      headers: authHeaders,
      method: "POST",
    });

    const second = await request<ConversationDto>("/conversations", {
      body: JSON.stringify({ recipientId: testUsers.taken.id }),
      headers: authHeaders,
      method: "POST",
    });

    expect(second.response.status).toBe(201);
    expect(second.body.id).toBe(first.body.id);
  });

  it("sends a message and retrieves it with pagination", async () => {
    const { accessToken } = await loginAs(request, testUsers.login.email);
    const authHeaders = { authorization: `Bearer ${accessToken}` };

    const { body: conversation } = await request<ConversationDto>("/conversations", {
      body: JSON.stringify({ recipientId: testUsers.taken.id }),
      headers: authHeaders,
      method: "POST",
    });

    const sendResponse = await request<MessageDto>(`/conversations/${conversation.id}/messages`, {
      body: JSON.stringify({ content: "Hello from e2e" }),
      headers: authHeaders,
      method: "POST",
    });

    expect(sendResponse.response.status).toBe(201);
    expect(sendResponse.body).toMatchObject({
      content: "Hello from e2e",
      conversationId: conversation.id,
      deletedAt: null,
      id: expect.any(String),
      senderId: testUsers.login.id,
    });

    const listResponse = await request<PaginatedMessagesDto>(
      `/conversations/${conversation.id}/messages?limit=20`,
      { headers: authHeaders },
    );

    expect(listResponse.response.status).toBe(200);
    expect(listResponse.body.items).toEqual(
      expect.arrayContaining([expect.objectContaining({ content: "Hello from e2e" })]),
    );
  });

  it("marks a conversation as read", async () => {
    const mayaTokens = await loginAs(request, testUsers.login.email);
    const takenTokens = await loginAs(request, testUsers.taken.email);
    const mayaHeaders = { authorization: `Bearer ${mayaTokens.accessToken}` };
    const takenHeaders = { authorization: `Bearer ${takenTokens.accessToken}` };

    const { body: conversation } = await request<ConversationDto>("/conversations", {
      body: JSON.stringify({ recipientId: testUsers.taken.id }),
      headers: mayaHeaders,
      method: "POST",
    });

    await request<MessageDto>(`/conversations/${conversation.id}/messages`, {
      body: JSON.stringify({ content: "Did you get this?" }),
      headers: takenHeaders,
      method: "POST",
    });

    const readResponse = await request(`/conversations/${conversation.id}/read`, {
      headers: mayaHeaders,
      method: "POST",
    });

    expect(readResponse.response.status).toBe(200);
    expect(readResponse.body).toMatchObject({
      conversationId: conversation.id,
      readAt: expect.any(String),
      userId: testUsers.login.id,
    });
  });

  it("deletes an owned message", async () => {
    const { accessToken } = await loginAs(request, testUsers.login.email);
    const authHeaders = { authorization: `Bearer ${accessToken}` };

    const { body: conversation } = await request<ConversationDto>("/conversations", {
      body: JSON.stringify({ recipientId: testUsers.taken.id }),
      headers: authHeaders,
      method: "POST",
    });

    const { body: message } = await request<MessageDto>(`/conversations/${conversation.id}/messages`, {
      body: JSON.stringify({ content: "To be deleted" }),
      headers: authHeaders,
      method: "POST",
    });

    const deleteResponse = await request<MessageDto>(`/messages/${message.id}`, {
      headers: authHeaders,
      method: "DELETE",
    });

    expect(deleteResponse.response.status).toBe(200);
    expect(deleteResponse.body).toMatchObject({
      id: message.id,
      deletedAt: expect.any(String),
    });
  });

  it("hides a conversation from a non-participant", async () => {
    const mayaTokens = await loginAs(request, testUsers.login.email);
    const outsiderTokens = await loginAs(request, testUsers.empty.email);
    const mayaHeaders = { authorization: `Bearer ${mayaTokens.accessToken}` };
    const outsiderHeaders = { authorization: `Bearer ${outsiderTokens.accessToken}` };

    const { body: conversation } = await request<ConversationDto>("/conversations", {
      body: JSON.stringify({ recipientId: testUsers.taken.id }),
      headers: mayaHeaders,
      method: "POST",
    });

    const response = await request<{ message: string }>(`/conversations/${conversation.id}/messages`, {
      body: JSON.stringify({ content: "I should not be here" }),
      headers: outsiderHeaders,
      method: "POST",
    });

    expect(response.response.status).toBe(404);
  });

  it("rejects deletion of another user's message", async () => {
    const mayaTokens = await loginAs(request, testUsers.login.email);
    const takenTokens = await loginAs(request, testUsers.taken.email);
    const mayaHeaders = { authorization: `Bearer ${mayaTokens.accessToken}` };
    const takenHeaders = { authorization: `Bearer ${takenTokens.accessToken}` };

    const { body: conversation } = await request<ConversationDto>("/conversations", {
      body: JSON.stringify({ recipientId: testUsers.taken.id }),
      headers: mayaHeaders,
      method: "POST",
    });

    const { body: message } = await request<MessageDto>(`/conversations/${conversation.id}/messages`, {
      body: JSON.stringify({ content: "Maya's message" }),
      headers: mayaHeaders,
      method: "POST",
    });

    const response = await request<{ message: string }>(`/messages/${message.id}`, {
      headers: takenHeaders,
      method: "DELETE",
    });

    expect(response.response.status).toBe(403);
  });
});

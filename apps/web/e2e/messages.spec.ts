import { expect, test } from "@playwright/test";
import type { ConversationDto, MessageDto } from "@social/contracts";
import { testUsers } from "@social/database";

import { e2eConfig } from "./config";
import { authenticate } from "./support/auth";
import { resetDatabase } from "./support/database";

const apiLogin = async (email: string) => {
  const response = await fetch(`${e2eConfig.apiURL}/auth/login`, {
    body: JSON.stringify({ email, password: "password123" }),
    headers: { "content-type": "application/json" },
    method: "POST",
  });
  return (await response.json()) as { accessToken: string };
};

const startConversation = async (accessToken: string, recipientId: string) => {
  const response = await fetch(`${e2eConfig.apiURL}/conversations`, {
    body: JSON.stringify({ recipientId }),
    headers: {
      authorization: `Bearer ${accessToken}`,
      "content-type": "application/json",
    },
    method: "POST",
  });
  return (await response.json()) as ConversationDto;
};

const sendMessage = async (accessToken: string, conversationId: string, content: string) => {
  const response = await fetch(`${e2eConfig.apiURL}/conversations/${conversationId}/messages`, {
    body: JSON.stringify({ content }),
    headers: {
      authorization: `Bearer ${accessToken}`,
      "content-type": "application/json",
    },
    method: "POST",
  });
  return (await response.json()) as MessageDto;
};

test.describe("messages page", () => {
  test.beforeEach(async () => {
    await resetDatabase();
  });

  test("redirects unauthenticated users to login", async ({ page }) => {
    await page.goto("/messages");

    await expect(page).toHaveURL(/\/login(?:\?next=%2Fmessages)?$/);
    await expect(page.getByRole("heading", { name: "Welcome back" })).toBeVisible();
  });

  test("shows empty state when there are no conversations", async ({ context, page, baseURL }) => {
    await authenticate(context, baseURL!, "empty");

    await page.goto("/messages");

    await expect(page.getByText("No conversations yet")).toBeVisible();
  });

  test("shows a conversation in the list after starting one", async ({ context, page, baseURL }) => {
    await authenticate(context, baseURL!, "posts");
    const { accessToken } = await apiLogin(testUsers.login.email);
    await startConversation(accessToken, testUsers.taken.id);

    await page.goto("/messages");

    await expect(page.getByRole("list", { name: "Conversations" })).toBeVisible();
    await expect(page.getByRole("link", { name: testUsers.taken.displayName })).toBeVisible();
  });

  test("navigates into a conversation and shows the active header", async ({ context, page, baseURL }) => {
    await authenticate(context, baseURL!, "posts");
    const { accessToken } = await apiLogin(testUsers.login.email);
    const conversation = await startConversation(accessToken, testUsers.taken.id);

    await page.goto("/messages");

    await page.getByRole("link", { name: testUsers.taken.displayName }).click();

    await expect(page).toHaveURL(`/messages/${conversation.id}`);
    await expect(page.getByRole("heading", { name: testUsers.taken.displayName })).toBeVisible();
  });

  test("sends a message and sees it appear in the thread", async ({ context, page, baseURL }) => {
    await authenticate(context, baseURL!, "posts");
    const { accessToken } = await apiLogin(testUsers.login.email);
    const conversation = await startConversation(accessToken, testUsers.taken.id);

    await page.goto(`/messages/${conversation.id}`);

    await page.getByLabel("Write a message").fill("Hello from Playwright");
    await page.getByLabel("Send message").click();

    await expect(
      page.getByRole("log").getByText("Hello from Playwright", { exact: true }),
    ).toBeVisible();
    await expect(page.getByLabel("Write a message")).toHaveValue("");
  });

  test("deletes a sent message and shows the deleted state", async ({ context, page, baseURL }) => {
    await authenticate(context, baseURL!, "posts");
    const { accessToken } = await apiLogin(testUsers.login.email);
    const conversation = await startConversation(accessToken, testUsers.taken.id);
    await sendMessage(accessToken, conversation.id, "To be deleted");

    await page.goto(`/messages/${conversation.id}`);

    const thread = page.getByRole("log");
    await expect(thread.getByText("To be deleted", { exact: true })).toBeVisible();

    await page.getByLabel("Open message actions").click();
    await page.getByRole("menuitem", { name: "Delete" }).click();

    await expect(page.getByText("Message deleted")).toBeVisible();
    await expect(thread.getByText("To be deleted", { exact: true })).toBeHidden();
  });

  test("shows existing messages when opening a conversation", async ({ context, page, baseURL }) => {
    await authenticate(context, baseURL!, "posts");
    const { accessToken } = await apiLogin(testUsers.login.email);
    const conversation = await startConversation(accessToken, testUsers.taken.id);
    await sendMessage(accessToken, conversation.id, "Pre-seeded message");

    await page.goto(`/messages/${conversation.id}`);

    await expect(page.getByRole("log").getByText("Pre-seeded message", { exact: true })).toBeVisible();
  });
});

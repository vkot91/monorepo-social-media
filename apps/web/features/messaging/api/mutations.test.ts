import { beforeEach, describe, expect, it, vi } from "vitest";

import { bffClient } from "#/shared/lib/api/api-client/bff-client";

import { deleteMessage, markConversationRead, sendMessage, startConversation } from "./mutations";

vi.mock("#/shared/lib/api/api-client/bff-client", () => ({
  bffClient: vi.fn(),
}));

describe("messaging mutations", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("starts a conversation with the recipient id", async () => {
    vi.mocked(bffClient).mockResolvedValueOnce({ id: "conv-1" });

    await startConversation({ recipientId: "user-2" });

    expect(bffClient).toHaveBeenCalledWith("/api/messaging/conversations", "POST", {
      body: { recipientId: "user-2" },
    });
  });

  it("sends a message to a conversation", async () => {
    vi.mocked(bffClient).mockResolvedValueOnce({ id: "msg-1" });

    await sendMessage({ conversationId: "conv-1", input: { content: "Hi" } });

    expect(bffClient).toHaveBeenCalledWith("/api/messaging/conversations/{id}/messages", "POST", {
      body: { content: "Hi" },
      params: { id: "conv-1" },
    });
  });

  it("marks a conversation as read", async () => {
    vi.mocked(bffClient).mockResolvedValueOnce({});

    await markConversationRead("conv-1");

    expect(bffClient).toHaveBeenCalledWith("/api/messaging/conversations/{id}/read", "POST", {
      params: { id: "conv-1" },
    });
  });

  it("deletes a message", async () => {
    vi.mocked(bffClient).mockResolvedValueOnce({ id: "msg-1" });

    await deleteMessage("msg-1");

    expect(bffClient).toHaveBeenCalledWith("/api/messaging/messages/{id}", "DELETE", {
      params: { id: "msg-1" },
    });
  });
});

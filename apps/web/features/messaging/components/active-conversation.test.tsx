import type { ConversationDto } from "@social/contracts";
import { QueryClientProvider } from "@tanstack/react-query";
import { act, render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { authKeys } from "#/features/auth/api/routes";
import { bffClient } from "#/shared/lib/api/api-client/bff-client";
import { getRealtimeSocket } from "#/shared/lib/realtime/socket";
import { createTestQueryClient } from "#/test/query-client";

import { messagingKeys } from "../api/routes";
import { ActiveConversation } from "./active-conversation";

vi.mock("#/shared/lib/api/api-client/bff-client", () => ({ bffClient: vi.fn() }));
vi.mock("#/shared/lib/realtime/socket", () => ({ getRealtimeSocket: vi.fn() }));

const buildConversation = (overrides: Partial<ConversationDto> = {}): ConversationDto => ({
  counterpartReadAt: null,
  createdAt: "2026-06-01T10:00:00.000Z",
  id: "conv-1",
  lastMessage: null,
  lastMessageAt: null,
  participant: { avatarUrl: null, displayName: "Ada Lovelace", id: "user-2", username: "ada" },
  unreadCount: 0,
  ...overrides,
});

const emptyMessages = {
  items: [],
  pageInfo: { hasNextPage: false, limit: 20, mode: "cursor", nextCursor: null },
};

const renderActive = (conversation: ConversationDto) => {
  const queryClient = createTestQueryClient();
  queryClient.setQueryData(authKeys.me(), { id: "user-1" });
  queryClient.setQueryData(messagingKeys.conversations, [conversation]);

  return {
    queryClient,
    ...render(
      <QueryClientProvider client={queryClient}>
        <ActiveConversation conversationId="conv-1" />
      </QueryClientProvider>,
    ),
  };
};

describe("ActiveConversation", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(getRealtimeSocket).mockReturnValue({ emit: vi.fn(), off: vi.fn(), on: vi.fn() } as never);
    vi.mocked(bffClient).mockImplementation((route: string) => {
      if (route === "/api/messaging/conversations") {
        return Promise.resolve([buildConversation()]) as never;
      }

      if (route === "/api/messaging/conversations/{id}/messages") {
        return Promise.resolve(emptyMessages) as never;
      }

      return Promise.resolve({}) as never;
    });
  });

  it("renders the counterpart name as the header title", async () => {
    renderActive(buildConversation());

    expect(await screen.findByText("Ada Lovelace")).toBeInTheDocument();
  });

  it("marks the conversation read when it has unread messages", async () => {
    renderActive(buildConversation({ unreadCount: 3 }));

    await waitFor(() =>
      expect(bffClient).toHaveBeenCalledWith("/api/messaging/conversations/{id}/read", "POST", { params: { id: "conv-1" } }),
    );
  });

  it("does not mark read when there are no unread messages", async () => {
    renderActive(buildConversation({ unreadCount: 0 }));

    await screen.findByText(/say hello/i);
    expect(bffClient).not.toHaveBeenCalledWith(
      "/api/messaging/conversations/{id}/read",
      "POST",
      expect.anything(),
    );
  });

  it("auto-marks read when an incoming message raises the unread count", async () => {
    const { queryClient } = renderActive(buildConversation({ unreadCount: 0 }));

    await screen.findByText(/say hello/i);

    act(() => {
      queryClient.setQueryData(messagingKeys.conversations, [buildConversation({ unreadCount: 1 })]);
    });

    await waitFor(() =>
      expect(bffClient).toHaveBeenCalledWith("/api/messaging/conversations/{id}/read", "POST", { params: { id: "conv-1" } }),
    );
  });
});

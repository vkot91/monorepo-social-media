import type { ConversationDto, MessageDto } from "@social/contracts";
import { QueryClientProvider } from "@tanstack/react-query";
import { act, renderHook } from "@testing-library/react";
import type { ReactNode } from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { authKeys } from "#/features/auth/api/routes";
import { getRealtimeSocket } from "#/shared/lib/realtime/socket";
import { createTestQueryClient } from "#/test/query-client";

import { type MessagesInfiniteData } from "../api/helpers/cache";
import { messagingKeys } from "../api/routes";
import { useMessagingSocket } from "./use-messaging-socket";

vi.mock("#/shared/lib/realtime/socket", () => ({
  getRealtimeSocket: vi.fn(),
}));

type Handler = (payload: unknown) => void;

const createFakeSocket = () => {
  const handlers = new Map<string, Handler>();

  return {
    connect: vi.fn(),
    handlers,
    off: vi.fn((event: string) => handlers.delete(event)),
    on: vi.fn((event: string, cb: Handler) => handlers.set(event, cb)),
  };
};

const buildMessage = (overrides: Partial<MessageDto> = {}): MessageDto => ({
  content: "Hello",
  conversationId: "conv-1",
  createdAt: "2026-06-04T10:00:00.000Z",
  deletedAt: null,
  id: "msg-1",
  senderId: "user-2",
  ...overrides,
});

const buildConversation = (): ConversationDto => ({
  counterpartReadAt: null,
  createdAt: "2026-06-01T10:00:00.000Z",
  id: "conv-1",
  lastMessage: null,
  lastMessageAt: null,
  participant: { avatarUrl: null, displayName: "Ada", id: "user-2", username: "ada" },
  unreadCount: 0,
});

describe("useMessagingSocket", () => {
  let socket: ReturnType<typeof createFakeSocket>;
  let queryClient: ReturnType<typeof createTestQueryClient>;

  const wrapper = ({ children }: { children: ReactNode }) => (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );

  beforeEach(() => {
    vi.clearAllMocks();
    socket = createFakeSocket();
    vi.mocked(getRealtimeSocket).mockReturnValue(socket as never);
    queryClient = createTestQueryClient();
  });

  it("does nothing until the viewer is known", () => {
    renderHook(() => useMessagingSocket(), { wrapper });

    expect(socket.on).not.toHaveBeenCalled();
  });

  it("wires live message events for the viewer", () => {
    queryClient.setQueryData(authKeys.me(), { id: "user-1" });
    queryClient.setQueryData<MessagesInfiniteData>(messagingKeys.messages("conv-1"), {
      pageParams: [null],
      pages: [{ items: [], pageInfo: { hasNextPage: false, limit: 20, mode: "cursor", nextCursor: null } }],
    });
    queryClient.setQueryData(messagingKeys.conversations, [buildConversation()]);

    renderHook(() => useMessagingSocket(), { wrapper });

    expect(socket.on).toHaveBeenCalledWith("message:new", expect.any(Function));

    act(() => socket.handlers.get("message:new")?.(buildMessage()));

    const messages = queryClient.getQueryData<MessagesInfiniteData>(messagingKeys.messages("conv-1"));
    expect(messages?.pages[0]?.items[0]?.id).toBe("msg-1");

    const conversations = queryClient.getQueryData<ConversationDto[]>(messagingKeys.conversations);
    expect(conversations?.[0]?.unreadCount).toBe(1);
  });

  it("replaces deleted messages in the cache", () => {
    queryClient.setQueryData(authKeys.me(), { id: "user-1" });
    queryClient.setQueryData<MessagesInfiniteData>(messagingKeys.messages("conv-1"), {
      pageParams: [null],
      pages: [{ items: [buildMessage()], pageInfo: { hasNextPage: false, limit: 20, mode: "cursor", nextCursor: null } }],
    });

    renderHook(() => useMessagingSocket(), { wrapper });

    act(() => socket.handlers.get("message:deleted")?.(buildMessage({ content: "", deletedAt: "2026-06-04T11:00:00.000Z" })));

    const messages = queryClient.getQueryData<MessagesInfiniteData>(messagingKeys.messages("conv-1"));
    expect(messages?.pages[0]?.items[0]?.deletedAt).toBe("2026-06-04T11:00:00.000Z");
  });

  it("tears down listeners on unmount", () => {
    queryClient.setQueryData(authKeys.me(), { id: "user-1" });

    const { unmount } = renderHook(() => useMessagingSocket(), { wrapper });
    unmount();

    expect(socket.off).toHaveBeenCalledWith("message:new", expect.any(Function));
    expect(socket.off).toHaveBeenCalledWith("message:deleted", expect.any(Function));
  });
});

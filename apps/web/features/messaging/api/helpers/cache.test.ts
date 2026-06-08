import type { ConversationDto, MessageDto, PaginatedMessagesDto } from "@social/contracts";
import { describe, expect, it } from "vitest";

import {
  addMessageToInfiniteData,
  bumpConversation,
  clearConversationUnread,
  type MessagesInfiniteData,
  replaceMessageInInfiniteData,
} from "./cache";

const buildMessage = (overrides: Partial<MessageDto> = {}): MessageDto => ({
  content: "Hello there",
  conversationId: "conv-1",
  createdAt: "2026-06-04T10:00:00.000Z",
  deletedAt: null,
  id: "msg-1",
  senderId: "user-2",
  ...overrides,
});

const buildConversation = (overrides: Partial<ConversationDto> = {}): ConversationDto => ({
  counterpartReadAt: null,
  createdAt: "2026-06-01T10:00:00.000Z",
  id: "conv-1",
  lastMessage: null,
  lastMessageAt: null,
  participant: { avatarUrl: null, displayName: "Ada", id: "user-2", username: "ada" },
  unreadCount: 0,
  ...overrides,
});

const buildPage = (items: MessageDto[]): PaginatedMessagesDto => ({
  items,
  pageInfo: { hasNextPage: false, limit: 20, mode: "cursor", nextCursor: null },
});

const buildInfiniteData = (pages: PaginatedMessagesDto[]): MessagesInfiniteData => ({
  pageParams: pages.map((_, i) => (i === 0 ? null : `cursor-${i}`)),
  pages,
});

describe("addMessageToInfiniteData", () => {
  it("prepends a new message to the first page", () => {
    const existing = buildMessage({ id: "msg-1" });
    const incoming = buildMessage({ id: "msg-2", content: "New" });
    const data = buildInfiniteData([buildPage([existing])]);

    const result = addMessageToInfiniteData(data, incoming);

    expect(result?.pages[0]?.items[0]).toEqual(incoming);
    expect(result?.pages[0]?.items[1]).toEqual(existing);
  });

  it("deduplicates a message already present in the first page", () => {
    const message = buildMessage({ id: "msg-1" });
    const data = buildInfiniteData([buildPage([message])]);

    const result = addMessageToInfiniteData(data, message);

    expect(result?.pages[0]?.items).toHaveLength(1);
  });

  it("leaves later pages untouched", () => {
    const data = buildInfiniteData([buildPage([buildMessage({ id: "msg-1" })]), buildPage([buildMessage({ id: "msg-2" })])]);

    const result = addMessageToInfiniteData(data, buildMessage({ id: "msg-3" }));

    expect(result?.pages[1]?.items).toHaveLength(1);
    expect(result?.pages[1]?.items[0]?.id).toBe("msg-2");
  });

  it("returns undefined unchanged when data is undefined", () => {
    expect(addMessageToInfiniteData(undefined, buildMessage())).toBeUndefined();
  });
});

describe("replaceMessageInInfiniteData", () => {
  it("replaces a matching message across pages", () => {
    const data = buildInfiniteData([buildPage([buildMessage({ id: "msg-1", content: "old" })])]);

    const result = replaceMessageInInfiniteData(data, buildMessage({ id: "msg-1", content: "", deletedAt: "2026-06-04T11:00:00.000Z" }));

    expect(result?.pages[0]?.items[0]?.deletedAt).toBe("2026-06-04T11:00:00.000Z");
    expect(result?.pages[0]?.items[0]?.content).toBe("");
  });

  it("returns undefined unchanged when data is undefined", () => {
    expect(replaceMessageInInfiniteData(undefined, buildMessage())).toBeUndefined();
  });
});

describe("bumpConversation", () => {
  it("increments unread for a message from the counterpart", () => {
    const conversations = [buildConversation({ unreadCount: 1 })];
    const message = buildMessage({ senderId: "user-2", createdAt: "2026-06-04T12:00:00.000Z" });

    const result = bumpConversation(conversations, message, "user-1");

    expect(result?.[0]?.unreadCount).toBe(2);
    expect(result?.[0]?.lastMessage).toEqual(message);
    expect(result?.[0]?.lastMessageAt).toBe("2026-06-04T12:00:00.000Z");
  });

  it("does not increment unread for the viewer's own message", () => {
    const conversations = [buildConversation({ unreadCount: 3 })];
    const message = buildMessage({ senderId: "user-1" });

    const result = bumpConversation(conversations, message, "user-1");

    expect(result?.[0]?.unreadCount).toBe(3);
  });

  it("re-sorts conversations by most recent activity", () => {
    const conversations = [
      buildConversation({ id: "conv-1", lastMessageAt: "2026-06-04T10:00:00.000Z" }),
      buildConversation({ id: "conv-2", lastMessageAt: "2026-06-04T09:00:00.000Z" }),
    ];
    const message = buildMessage({ conversationId: "conv-2", createdAt: "2026-06-04T13:00:00.000Z", senderId: "user-1" });

    const result = bumpConversation(conversations, message, "user-1");

    expect(result?.[0]?.id).toBe("conv-2");
  });

  it("returns undefined unchanged when conversations are undefined", () => {
    expect(bumpConversation(undefined, buildMessage(), "user-1")).toBeUndefined();
  });
});

describe("clearConversationUnread", () => {
  it("zeroes unread for the matching conversation only", () => {
    const conversations = [
      buildConversation({ id: "conv-1", unreadCount: 4 }),
      buildConversation({ id: "conv-2", unreadCount: 2 }),
    ];

    const result = clearConversationUnread(conversations, "conv-1");

    expect(result?.[0]?.unreadCount).toBe(0);
    expect(result?.[1]?.unreadCount).toBe(2);
  });

  it("returns undefined unchanged when conversations are undefined", () => {
    expect(clearConversationUnread(undefined, "conv-1")).toBeUndefined();
  });
});

import type { PaginatedMessagesDto } from "@social/contracts";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { bffClient } from "#/shared/lib/api/api-client/bff-client";

import { conversationsQueryOptions, getConversations, messagesInfiniteQueryOptions } from "./queries";
import { messagingKeys } from "./routes";

vi.mock("#/shared/lib/api/api-client/bff-client", () => ({
  bffClient: vi.fn(),
}));

const cursorPage = (nextCursor: string | null): PaginatedMessagesDto => ({
  items: [],
  pageInfo: { hasNextPage: nextCursor !== null, limit: 20, mode: "cursor", nextCursor },
});

describe("messaging queries", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("fetches conversations from the BFF", async () => {
    vi.mocked(bffClient).mockResolvedValueOnce([]);

    await getConversations();

    expect(bffClient).toHaveBeenCalledWith("/api/messaging/conversations", "GET", {});
  });

  it("exposes the conversations query key", () => {
    expect(conversationsQueryOptions().queryKey).toEqual(messagingKeys.conversations);
  });

  it("builds the messages query key per conversation", () => {
    expect(messagesInfiniteQueryOptions("conv-1").queryKey).toEqual(messagingKeys.messages("conv-1"));
  });

  it("requests a cursor page for the conversation", async () => {
    vi.mocked(bffClient).mockResolvedValueOnce(cursorPage(null));
    const options = messagesInfiniteQueryOptions("conv-1");

    await options.queryFn?.({ pageParam: "cursor-abc" } as never);

    expect(bffClient).toHaveBeenCalledWith("/api/messaging/conversations/{id}/messages", "GET", {
      params: { id: "conv-1" },
      queryParams: { cursor: "cursor-abc", mode: "cursor" },
    });
  });

  it("returns the next cursor when present", () => {
    const options = messagesInfiniteQueryOptions("conv-1");

    expect(options.getNextPageParam(cursorPage("next-1"), [], null, [])).toBe("next-1");
  });

  it("stops paginating when there is no next cursor", () => {
    const options = messagesInfiniteQueryOptions("conv-1");

    expect(options.getNextPageParam(cursorPage(null), [], null, [])).toBeUndefined();
  });

  it("stops paginating for non-cursor pages", () => {
    const options = messagesInfiniteQueryOptions("conv-1");
    const offsetPage = {
      items: [],
      pageInfo: { hasNextPage: true, limit: 20, mode: "offset", page: 1, total: 40, totalPages: 2 },
    } as unknown as PaginatedMessagesDto;

    expect(options.getNextPageParam(offsetPage, [], null, [])).toBeUndefined();
  });
});

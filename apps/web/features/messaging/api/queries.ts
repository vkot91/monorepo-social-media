import type { ConversationDto, PaginatedMessagesDto } from "@social/contracts";
import { infiniteQueryOptions, queryOptions } from "@tanstack/react-query";

import { bffClient } from "#/shared/lib/api/api-client/bff-client";

import { messagingKeys } from "./routes";

export const getConversations = (): Promise<ConversationDto[]> =>
  bffClient("/api/messaging/conversations", "GET", {});

export const conversationsQueryOptions = () =>
  queryOptions({
    queryFn: getConversations,
    queryKey: messagingKeys.conversations,
  });

export const messagesInfiniteQueryOptions = (conversationId: string) =>
  infiniteQueryOptions({
    getNextPageParam: (lastPage: PaginatedMessagesDto) =>
      lastPage.pageInfo.mode === "cursor" ? (lastPage.pageInfo.nextCursor ?? undefined) : undefined,
    initialPageParam: null,
    queryFn: ({ pageParam }) =>
      bffClient("/api/messaging/conversations/{id}/messages", "GET", {
        params: { id: conversationId },
        queryParams: { cursor: pageParam ?? undefined, mode: "cursor" },
      }),
    queryKey: messagingKeys.messages(conversationId),
  });

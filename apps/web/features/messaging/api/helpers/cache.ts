import type { ConversationDto, MessageDto, PaginatedMessagesDto } from "@social/contracts";
import type { InfiniteData } from "@tanstack/react-query";

export type MessagesInfiniteData = InfiniteData<PaginatedMessagesDto>;

export const addMessageToInfiniteData = (
  data: MessagesInfiniteData | undefined,
  message: MessageDto,
): MessagesInfiniteData | undefined =>
  data
    ? {
        ...data,
        pages: data.pages.map((page, index) =>
          index === 0
            ? { ...page, items: [message, ...page.items.filter((item) => item.id !== message.id)] }
            : page,
        ),
      }
    : data;

export const replaceMessageInInfiniteData = (
  data: MessagesInfiniteData | undefined,
  message: MessageDto,
): MessagesInfiniteData | undefined =>
  data
    ? {
        ...data,
        pages: data.pages.map((page) => ({
          ...page,
          items: page.items.map((item) => (item.id === message.id ? message : item)),
        })),
      }
    : data;

export const bumpConversation = (
  conversations: ConversationDto[] | undefined,
  message: MessageDto,
  viewerId: string,
): ConversationDto[] | undefined => {
  if (!conversations) {
    return conversations;
  }

  const next = conversations.map((conversation) =>
    conversation.id === message.conversationId
      ? {
          ...conversation,
          lastMessage: message,
          lastMessageAt: message.createdAt,
          unreadCount:
            message.senderId === viewerId ? conversation.unreadCount : conversation.unreadCount + 1,
        }
      : conversation,
  );

  return [...next].sort((a, b) => (b.lastMessageAt ?? "").localeCompare(a.lastMessageAt ?? ""));
};

export const clearConversationUnread = (
  conversations: ConversationDto[] | undefined,
  conversationId: string,
): ConversationDto[] | undefined =>
  conversations?.map((conversation) =>
    conversation.id === conversationId ? { ...conversation, unreadCount: 0 } : conversation,
  );

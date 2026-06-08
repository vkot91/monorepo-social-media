import type {
  ConversationDto,
  ListMessagesQueryInput,
  MessageDto,
  MessageReadEvent,
  PaginatedMessagesDto,
  SendMessageInput,
  StartConversationInput,
} from "@social/contracts";

import type { ApiRoute } from "#/shared/lib/api/types";

export type MessagingBackendApiRoutes = {
  "/conversations": {
    GET: ApiRoute<{ response: ConversationDto[] }>;
    POST: ApiRoute<{ body: StartConversationInput; response: ConversationDto }>;
  };
  "/conversations/{id}/messages": {
    GET: ApiRoute<{
      params: { id: string };
      queryParams: ListMessagesQueryInput;
      response: PaginatedMessagesDto;
    }>;
    POST: ApiRoute<{ body: SendMessageInput; params: { id: string }; response: MessageDto }>;
  };
  "/conversations/{id}/read": {
    POST: ApiRoute<{ params: { id: string }; response: MessageReadEvent }>;
  };
  "/messages/{id}": {
    DELETE: ApiRoute<{ params: { id: string }; response: MessageDto }>;
  };
};

export type MessagingBffApiRoutes = {
  "/api/realtime/token": { GET: ApiRoute<{ response: { token: string } }> };
  "/api/messaging/conversations": {
    GET: ApiRoute<{ response: ConversationDto[] }>;
    POST: ApiRoute<{ body: StartConversationInput; response: ConversationDto }>;
  };
  "/api/messaging/conversations/{id}/messages": {
    GET: ApiRoute<{
      params: { id: string };
      queryParams: ListMessagesQueryInput;
      response: PaginatedMessagesDto;
    }>;
    POST: ApiRoute<{ body: SendMessageInput; params: { id: string }; response: MessageDto }>;
  };
  "/api/messaging/conversations/{id}/read": {
    POST: ApiRoute<{ params: { id: string }; response: MessageReadEvent }>;
  };
  "/api/messaging/messages/{id}": {
    DELETE: ApiRoute<{ params: { id: string }; response: MessageDto }>;
  };
};

export const messagingKeys = {
  conversations: ["messaging", "conversations"] as const,
  messages: (conversationId: string) => ["messaging", "messages", conversationId] as const,
  messagesRoot: ["messaging", "messages"] as const,
};

export const messagingMutationKeys = {
  send: ["messaging", "send"] as const,
};

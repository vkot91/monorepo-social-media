import type { z } from "zod";

import type { PaginatedResponse } from "../pagination";
import type {
  ConversationParticipantSchema,
  ConversationSchema,
  listMessagesQuerySchema,
  messageReadEventSchema,
  MessageSchema,
  presenceEventSchema,
  sendMessageSchema,
  startConversationSchema,
  typingEventSchema,
} from "./schemas";

export type ConversationParticipantDto = z.infer<typeof ConversationParticipantSchema>;
export type MessageDto = z.infer<typeof MessageSchema>;
export type ConversationDto = z.infer<typeof ConversationSchema>;
export type PaginatedMessagesDto = PaginatedResponse<MessageDto>;

export type StartConversationInput = z.infer<typeof startConversationSchema>;
export type SendMessageInput = z.infer<typeof sendMessageSchema>;
export type ListMessagesQueryInput = z.infer<typeof listMessagesQuerySchema>;

export type TypingEvent = z.infer<typeof typingEventSchema>;
export type MessageReadEvent = z.infer<typeof messageReadEventSchema>;
export type PresenceEvent = z.infer<typeof presenceEventSchema>;

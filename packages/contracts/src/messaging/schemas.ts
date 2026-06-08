import { z } from "zod";

import { paginatedResponseSchema, paginationQueryShape, validatePaginationQuery } from "../pagination";

export const messageContentSchema = z
  .string()
  .trim()
  .min(1, { message: "Please type a message" })
  .max(5000);

export const ConversationParticipantSchema = z.object({
  avatarUrl: z.string().nullable(),
  displayName: z.string(),
  id: z.string(),
  username: z.string(),
});

export const MessageSchema = z.object({
  content: z.string(),
  conversationId: z.string(),
  createdAt: z.string().datetime(),
  deletedAt: z.string().datetime().nullable(),
  id: z.string(),
  senderId: z.string(),
});

export const ConversationSchema = z.object({
  // When the counterpart last read this conversation — used to render "seen" state on load.
  counterpartReadAt: z.string().datetime().nullable(),
  createdAt: z.string().datetime(),
  id: z.string(),
  lastMessage: MessageSchema.nullable(),
  lastMessageAt: z.string().datetime().nullable(),
  // The OTHER participant (1:1), from the requesting user's perspective.
  participant: ConversationParticipantSchema,
  unreadCount: z.number().int().nonnegative(),
});

export const PaginatedMessagesSchema = paginatedResponseSchema(MessageSchema);
export const ConversationsSchema = z.array(ConversationSchema);

export const startConversationSchema = z.object({
  recipientId: z.string().uuid(),
});

export const sendMessageSchema = z.object({
  content: messageContentSchema,
});

export const listMessagesQuerySchema = z
  .object({ ...paginationQueryShape })
  .superRefine(validatePaginationQuery);

// --- WebSocket event payloads ---
export const typingEventSchema = z.object({
  conversationId: z.string().uuid(),
  isTyping: z.boolean(),
});

export const messageReadEventSchema = z.object({
  conversationId: z.string(),
  readAt: z.string().datetime(),
  userId: z.string(),
});

export const presenceEventSchema = z.object({
  online: z.boolean(),
  userId: z.string(),
});

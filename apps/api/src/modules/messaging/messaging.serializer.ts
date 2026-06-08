import type { ConversationDto, MessageDto } from "@social/contracts";
import type { Prisma } from "@social/database";

export const participantUserSelect = {
  select: { avatarUrl: true, displayName: true, id: true, username: true },
} satisfies Prisma.UserDefaultArgs;

export const conversationWithParticipants = {
  include: {
    messages: { orderBy: { createdAt: "desc" }, take: 1 },
    participants: { include: { user: participantUserSelect } },
  },
} satisfies Prisma.ConversationDefaultArgs;

export type ConversationRecord = Prisma.ConversationGetPayload<typeof conversationWithParticipants>;
export type MessageRecord = Prisma.MessageGetPayload<object>;

export const buildPairKey = (userIdA: string, userIdB: string): string =>
  [userIdA, userIdB].sort().join(":");

export const serializeMessage = (message: MessageRecord): MessageDto => ({
  content: message.deletedAt ? "" : message.content,
  conversationId: message.conversationId,
  createdAt: message.createdAt.toISOString(),
  deletedAt: message.deletedAt ? message.deletedAt.toISOString() : null,
  id: message.id,
  senderId: message.senderId,
});

export const serializeConversation = (
  conversation: ConversationRecord,
  viewerId: string,
  unreadCount: number,
): ConversationDto => {
  const otherParticipant = conversation.participants.find((participant) => participant.userId !== viewerId);

  if (!otherParticipant) {
    throw new Error(`Conversation ${conversation.id} is missing a counterpart for viewer ${viewerId}`);
  }

  const lastMessage = conversation.messages.at(0);

  return {
    counterpartReadAt: otherParticipant.lastReadAt ? otherParticipant.lastReadAt.toISOString() : null,
    createdAt: conversation.createdAt.toISOString(),
    id: conversation.id,
    lastMessage: lastMessage ? serializeMessage(lastMessage) : null,
    lastMessageAt: conversation.lastMessageAt ? conversation.lastMessageAt.toISOString() : null,
    participant: otherParticipant.user,
    unreadCount,
  };
};

import { ForbiddenException, Injectable, NotFoundException } from "@nestjs/common";
import type {
  ConversationDto,
  ListMessagesQueryInput,
  MessageDto,
  MessageReadEvent,
  PaginatedMessagesDto,
} from "@social/contracts";
import { FriendshipStatus, type Prisma, prisma } from "@social/database";
import { z } from "zod";

import { PaginationService } from "#common/pagination/pagination.service";

import {
  buildPairKey,
  conversationWithParticipants,
  serializeConversation,
  serializeMessage,
} from "./messaging.serializer";

const messageCursorSchema = z.object({
  createdAt: z.string().datetime(),
  id: z.string(),
  version: z.literal(1),
});

@Injectable()
export class MessagingService {
  constructor(private readonly paginationService: PaginationService) {}

  async startConversation(userId: string, recipientId: string): Promise<ConversationDto> {
    if (userId === recipientId) {
      throw new ForbiddenException("You cannot message yourself");
    }

    await this.assertCanMessage(userId, recipientId);

    const pairKey = buildPairKey(userId, recipientId);

    const conversation = await prisma.conversation.upsert({
      ...conversationWithParticipants,
      create: {
        pairKey,
        participants: { create: [{ userId }, { userId: recipientId }] },
      },
      update: {},
      where: { pairKey },
    });

    const unreadCount = await this.countUnread(conversation.id, userId);

    return serializeConversation(conversation, userId, unreadCount);
  }

  async listConversations(userId: string): Promise<ConversationDto[]> {
    const conversations = await prisma.conversation.findMany({
      ...conversationWithParticipants,
      orderBy: { lastMessageAt: "desc" },
      where: { participants: { some: { userId } } },
    });

    return Promise.all(
      conversations.map(async (conversation) => {
        const unreadCount = await this.countUnread(conversation.id, userId);

        return serializeConversation(conversation, userId, unreadCount);
      }),
    );
  }

  async listMessages(
    userId: string,
    conversationId: string,
    query: ListMessagesQueryInput,
  ): Promise<PaginatedMessagesDto> {
    await this.assertParticipant(conversationId, userId);

    const pagination = this.paginationService.resolveCursorQuery(query);

    const messages = await prisma.message.findMany({
      orderBy: [{ createdAt: "desc" }, { id: "desc" }],
      take: pagination.limit + 1,
      where: this.withCursorWhere(conversationId, pagination.cursor),
    });

    const page = this.paginationService.buildCursorPage(messages, pagination.limit, (message) => ({
      createdAt: message.createdAt.toISOString(),
      id: message.id,
      version: 1,
    }));

    return {
      items: page.items.map(serializeMessage),
      pageInfo: page.pageInfo,
    };
  }

  async sendMessage(userId: string, conversationId: string, content: string): Promise<MessageDto> {
    await this.assertParticipant(conversationId, userId);

    const message = await prisma.$transaction(async (tx) => {
      const created = await tx.message.create({
        data: { content, conversationId, senderId: userId },
      });
      await tx.conversation.update({
        data: { lastMessageAt: created.createdAt },
        where: { id: conversationId },
      });
      await tx.conversationParticipant.update({
        data: { lastReadAt: created.createdAt },
        where: { conversationId_userId: { conversationId, userId } },
      });

      return created;
    });

    return serializeMessage(message);
  }

  async deleteMessage(userId: string, messageId: string): Promise<MessageDto> {
    const message = await prisma.message.findUnique({ where: { id: messageId } });

    if (!message) {
      throw new NotFoundException("Message not found");
    }

    if (message.senderId !== userId) {
      throw new ForbiddenException("You can only delete your own messages");
    }

    if (message.deletedAt) {
      return serializeMessage(message);
    }

    const updated = await prisma.message.update({
      data: { deletedAt: new Date() },
      where: { id: messageId },
    });

    return serializeMessage(updated);
  }

  async markRead(userId: string, conversationId: string): Promise<MessageReadEvent> {
    await this.assertParticipant(conversationId, userId);

    const readAt = new Date();

    await prisma.conversationParticipant.update({
      data: { lastReadAt: readAt },
      where: { conversationId_userId: { conversationId, userId } },
    });

    return { conversationId, readAt: readAt.toISOString(), userId };
  }

  async getCounterpartId(conversationId: string, userId: string): Promise<string> {
    const other = await prisma.conversationParticipant.findFirst({
      select: { userId: true },
      where: { conversationId, userId: { not: userId } },
    });

    if (!other) {
      throw new NotFoundException("Conversation not found");
    }

    return other.userId;
  }

  private withCursorWhere(conversationId: string, cursor: string | undefined): Prisma.MessageWhereInput {
    if (!cursor) {
      return { conversationId };
    }

    const decodedCursor = this.paginationService.decodeCursor(cursor, messageCursorSchema);
    const cursorCreatedAt = new Date(decodedCursor.createdAt);

    return {
      AND: [
        { conversationId },
        {
          OR: [{ createdAt: { lt: cursorCreatedAt } }, { createdAt: cursorCreatedAt, id: { lt: decodedCursor.id } }],
        },
      ],
    };
  }

  private async countUnread(conversationId: string, userId: string): Promise<number> {
    const participant = await prisma.conversationParticipant.findUnique({
      where: { conversationId_userId: { conversationId, userId } },
    });

    return prisma.message.count({
      where: {
        conversationId,
        deletedAt: null,
        senderId: { not: userId },
        ...(participant?.lastReadAt ? { createdAt: { gt: participant.lastReadAt } } : {}),
      },
    });
  }

  private async assertParticipant(conversationId: string, userId: string): Promise<void> {
    const participant = await prisma.conversationParticipant.findUnique({
      where: { conversationId_userId: { conversationId, userId } },
    });

    if (!participant) {
      throw new NotFoundException("Conversation not found");
    }
  }

  private async assertCanMessage(userId: string, otherUserId: string): Promise<void> {
    const friendship = await prisma.friendship.findFirst({
      where: {
        status: FriendshipStatus.ACCEPTED,
        OR: [
          { addresseeId: otherUserId, requesterId: userId },
          { addresseeId: userId, requesterId: otherUserId },
        ],
      },
    });

    if (!friendship) {
      throw new ForbiddenException("You can only message your friends");
    }

    const block = await prisma.userBlock.findFirst({
      where: {
        OR: [
          { blockedId: otherUserId, blockerId: userId },
          { blockedId: userId, blockerId: otherUserId },
        ],
      },
    });

    if (block) {
      throw new ForbiddenException("Messaging is unavailable with this user");
    }
  }
}

import { Injectable, type OnModuleDestroy } from "@nestjs/common";
import { prisma } from "@social/database";
import Redis from "ioredis";

import { env } from "#config/env";

const membershipKey = (conversationId: string) => `conversation:${conversationId}:participants`;

// Conversation membership is effectively immutable for 1:1 chats, so a short TTL
// keeps typing relays off the hot DB path while still picking up new conversations.
const MEMBERSHIP_TTL_SECONDS = 300;

@Injectable()
export class ConversationMembershipService implements OnModuleDestroy {
  private readonly redis = new Redis(env.REDIS_URL);

  async getParticipantIds(conversationId: string): Promise<string[]> {
    const cached = await this.redis.get(membershipKey(conversationId));

    if (cached) {
      return JSON.parse(cached) as string[];
    }

    const participants = await prisma.conversationParticipant.findMany({
      select: { userId: true },
      where: { conversationId },
    });

    const ids = participants.map((participant) => participant.userId);

    if (ids.length > 0) {
      await this.redis.set(membershipKey(conversationId), JSON.stringify(ids), "EX", MEMBERSHIP_TTL_SECONDS);
    }

    return ids;
  }

  async onModuleDestroy(): Promise<void> {
    await this.redis.quit();
  }
}

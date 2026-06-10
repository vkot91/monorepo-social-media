import { SubscribeMessage, WebSocketGateway, WebSocketServer } from "@nestjs/websockets";
import { type MessageDto, type MessageReadEvent, type TypingEvent, typingEventSchema } from "@social/contracts";
import type { Server, Socket } from "socket.io";

import { env } from "#config/env";
import { WsRateLimitService } from "#modules/rate-limit/ws/ws-rate-limit.service";

import { ConversationMembershipService } from "./conversation-membership.service";

type SocketData = { userId?: string };

const TYPING_EVENT = "typing";

const userRoom = (userId: string) => `user:${userId}`;

const getUserId = (client: Socket): string | undefined => (client.data as SocketData).userId;

@WebSocketGateway()
export class MessagingGateway {
  @WebSocketServer() private server!: Server;

  constructor(
    private readonly membershipService: ConversationMembershipService,
    private readonly wsRateLimit: WsRateLimitService,
  ) {}

  @SubscribeMessage(TYPING_EVENT)
  async handleTyping(client: Socket, payload: TypingEvent): Promise<void> {
    const parsed = typingEventSchema.safeParse(payload);
    const userId = getUserId(client);

    if (!parsed.success || !userId) {
      return;
    }

    const limit = await this.wsRateLimit.consume(
      userId,
      TYPING_EVENT,
      env.RATE_LIMIT_WS_TYPING_LIMIT,
      env.RATE_LIMIT_WS_TYPING_WINDOW_MS,
    );

    if (!limit.allowed) {
      client.emit("rate_limited", { event: TYPING_EVENT, retryAfterSeconds: limit.retryAfterSeconds });

      return;
    }

    const participantIds = await this.membershipService.getParticipantIds(parsed.data.conversationId);

    if (!participantIds.includes(userId)) {
      return;
    }

    const counterpartId = participantIds.find((id) => id !== userId);

    if (!counterpartId) {
      return;
    }

    this.server.to(userRoom(counterpartId)).emit("typing", {
      conversationId: parsed.data.conversationId,
      isTyping: parsed.data.isTyping,
      userId,
    });
  }

  // --- emit helpers called by the controller after REST mutations ---
  emitNewMessage(recipientIds: string[], message: MessageDto): void {
    for (const recipientId of recipientIds) {
      this.server.to(userRoom(recipientId)).emit("message:new", message);
    }
  }

  emitMessageDeleted(recipientIds: string[], message: MessageDto): void {
    for (const recipientId of recipientIds) {
      this.server.to(userRoom(recipientId)).emit("message:deleted", message);
    }
  }

  emitMessageRead(recipientId: string, event: MessageReadEvent): void {
    this.server.to(userRoom(recipientId)).emit("message:read", event);
  }
}

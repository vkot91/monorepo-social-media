import { SubscribeMessage, WebSocketGateway, WebSocketServer } from "@nestjs/websockets";
import { type MessageDto, type MessageReadEvent, type TypingEvent, typingEventSchema } from "@social/contracts";
import type { Server, Socket } from "socket.io";

import { ConversationMembershipService } from "./conversation-membership.service";

type SocketData = { userId?: string };

const userRoom = (userId: string) => `user:${userId}`;

const getUserId = (client: Socket): string | undefined => (client.data as SocketData).userId;

@WebSocketGateway()
export class MessagingGateway {
  @WebSocketServer() private server!: Server;

  constructor(private readonly membershipService: ConversationMembershipService) {}

  @SubscribeMessage("typing")
  async handleTyping(client: Socket, payload: TypingEvent): Promise<void> {
    const parsed = typingEventSchema.safeParse(payload);
    const userId = getUserId(client);

    if (!parsed.success || !userId) {
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

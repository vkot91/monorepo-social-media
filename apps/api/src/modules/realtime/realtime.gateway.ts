import type { OnModuleDestroy, OnModuleInit } from "@nestjs/common";
import { JwtService } from "@nestjs/jwt";
import {
  type OnGatewayConnection,
  type OnGatewayDisconnect,
  WebSocketGateway,
  WebSocketServer,
} from "@nestjs/websockets";
import { FriendshipStatus, prisma } from "@social/database";
import type { Server, Socket } from "socket.io";

import { env } from "#config/env";
import type { AuthTokenPayload } from "#modules/auth/types/auth-token-payload";

import { PresenceService } from "./presence.service";

type SocketData = { userId?: string };

const userRoom = (userId: string) => `user:${userId}`;

const getUserId = (client: Socket): string | undefined => (client.data as SocketData).userId;

// Re-stamp the presence TTL for live sockets well within PRESENCE_TTL_SECONDS so a
// connected user never expires, while leaked memberships are left to expire.
const PRESENCE_REFRESH_INTERVAL_MS = 60_000;

@WebSocketGateway()
export class RealtimeGateway implements OnGatewayConnection, OnGatewayDisconnect, OnModuleInit, OnModuleDestroy {
  @WebSocketServer() private server!: Server;
  private presenceSweep: ReturnType<typeof setInterval> | null = null;

  constructor(
    private readonly jwtService: JwtService,
    private readonly presenceService: PresenceService,
  ) {}

  onModuleInit(): void {
    this.presenceSweep = setInterval(() => {
      void this.refreshLocalPresence();
    }, PRESENCE_REFRESH_INTERVAL_MS);
  }

  onModuleDestroy(): void {
    if (this.presenceSweep) {
      clearInterval(this.presenceSweep);
      this.presenceSweep = null;
    }
  }

  async handleConnection(client: Socket): Promise<void> {
    const rawToken: unknown = client.handshake.auth?.token;
    const token = typeof rawToken === "string" ? rawToken : null;

    if (!token) {
      client.disconnect();

      return;
    }

    try {
      const payload = await this.jwtService.verifyAsync<AuthTokenPayload>(token, {
        secret: env.JWT_ACCESS_SECRET,
      });

      if (payload.type !== "access") {
        client.disconnect();

        return;
      }

      (client.data as SocketData).userId = payload.sub;
      await client.join(userRoom(payload.sub));

      await this.sendPresenceSnapshot(client, payload.sub);

      const cameOnline = await this.presenceService.addConnection(payload.sub, client.id);

      if (cameOnline) {
        await this.broadcastPresence(payload.sub, true);
      }
    } catch {
      client.disconnect();
    }
  }

  async handleDisconnect(client: Socket): Promise<void> {
    const userId = getUserId(client);

    if (!userId) {
      return;
    }

    const wentOffline = await this.presenceService.removeConnection(userId, client.id);

    if (wentOffline) {
      await this.broadcastPresence(userId, false);
    }
  }

  // Keep presence TTLs warm for every socket still connected to this node. Leaked
  // memberships (no live socket anywhere) get no refresh and expire on their own.
  private async refreshLocalPresence(): Promise<void> {
    const refreshes: Array<Promise<void>> = [];

    for (const socket of this.server.of("/").sockets.values()) {
      const userId = getUserId(socket);

      if (userId) {
        refreshes.push(this.presenceService.refresh(userId, socket.id));
      }
    }

    await Promise.all(refreshes);
  }

  private async broadcastPresence(userId: string, online: boolean): Promise<void> {
    const friendIds = await this.getFriendIds(userId);

    for (const friendId of friendIds) {
      this.server.to(userRoom(friendId)).emit("presence", { online, userId });
    }
  }

  // Replay the current online state of the user's friends to a freshly connected client.
  private async sendPresenceSnapshot(client: Socket, userId: string): Promise<void> {
    const friendIds = await this.getFriendIds(userId);

    const statuses = await Promise.all(
      friendIds.map(async (friendId) => ({ online: await this.presenceService.isOnline(friendId), userId: friendId })),
    );

    for (const status of statuses) {
      if (status.online) {
        client.emit("presence", { online: true, userId: status.userId });
      }
    }
  }

  private async getFriendIds(userId: string): Promise<string[]> {
    const friendships = await prisma.friendship.findMany({
      select: { addresseeId: true, requesterId: true },
      where: { status: FriendshipStatus.ACCEPTED, OR: [{ requesterId: userId }, { addresseeId: userId }] },
    });

    return friendships.map((friendship) =>
      friendship.requesterId === userId ? friendship.addresseeId : friendship.requesterId,
    );
  }
}

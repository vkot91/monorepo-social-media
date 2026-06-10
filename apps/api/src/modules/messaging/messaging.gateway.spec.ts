import type { MessageDto, MessageReadEvent } from "@social/contracts";
import type { Server, Socket } from "socket.io";

import type { WsRateLimitService } from "#modules/rate-limit/ws/ws-rate-limit.service";

import type { ConversationMembershipService } from "./conversation-membership.service";
import { MessagingGateway } from "./messaging.gateway";

type EmitTarget = { emit: jest.Mock };

const createRateLimit = (
  result = { allowed: true, retryAfterSeconds: 0 },
): jest.Mocked<Pick<WsRateLimitService, "consume">> => ({
  consume: jest.fn().mockResolvedValue(result),
});

const createServer = () => {
  const rooms = new Map<string, EmitTarget>();

  const server = {
    to: jest.fn((room: string) => {
      const target = rooms.get(room) ?? { emit: jest.fn() };
      rooms.set(room, target);

      return target;
    }),
  };

  return { rooms, server: server as unknown as Server };
};

const createClient = (userId?: string): Socket & { emit: jest.Mock } =>
  ({ data: { userId }, emit: jest.fn() }) as unknown as Socket & { emit: jest.Mock };

const buildGateway = (
  server: Server,
  membership: Pick<ConversationMembershipService, "getParticipantIds">,
  rateLimit: Pick<WsRateLimitService, "consume"> = createRateLimit(),
) => {
  const gateway = new MessagingGateway(membership as ConversationMembershipService, rateLimit as WsRateLimitService);
  (gateway as unknown as { server: Server }).server = server;

  return gateway;
};

describe("MessagingGateway", () => {
  let membership: jest.Mocked<Pick<ConversationMembershipService, "getParticipantIds">>;

  beforeEach(() => {
    jest.clearAllMocks();
    membership = { getParticipantIds: jest.fn() };
  });

  describe("handleTyping", () => {
    it("relays a typing event to the counterpart room", async () => {
      const { rooms, server } = createServer();
      const gateway = buildGateway(server, membership);
      membership.getParticipantIds.mockResolvedValue(["user-1", "user-2"]);

      await gateway.handleTyping(createClient("user-1"), { conversationId: "11111111-1111-1111-1111-111111111111", isTyping: true });

      expect(rooms.get("user:user-2")?.emit).toHaveBeenCalledWith("typing", {
        conversationId: "11111111-1111-1111-1111-111111111111",
        isTyping: true,
        userId: "user-1",
      });
    });

    it("ignores a payload that fails schema validation", async () => {
      const { server } = createServer();
      const gateway = buildGateway(server, membership);

      await gateway.handleTyping(createClient("user-1"), { conversationId: "not-a-uuid", isTyping: true } as never);

      expect(membership.getParticipantIds).not.toHaveBeenCalled();
    });

    it("ignores an unauthenticated socket", async () => {
      const { server } = createServer();
      const gateway = buildGateway(server, membership);

      await gateway.handleTyping(createClient(undefined), { conversationId: "11111111-1111-1111-1111-111111111111", isTyping: true });

      expect(membership.getParticipantIds).not.toHaveBeenCalled();
    });

    it("emits rate_limited and skips relaying when the typing limit is exceeded", async () => {
      const { rooms, server } = createServer();
      const rateLimit = createRateLimit({ allowed: false, retryAfterSeconds: 7 });
      const gateway = buildGateway(server, membership, rateLimit);
      const client = createClient("user-1");

      await gateway.handleTyping(client, { conversationId: "11111111-1111-1111-1111-111111111111", isTyping: true });

      expect(client.emit).toHaveBeenCalledWith("rate_limited", { event: "typing", retryAfterSeconds: 7 });
      expect(membership.getParticipantIds).not.toHaveBeenCalled();
      expect(rooms.size).toBe(0);
    });

    it("does not relay when the sender is not a participant", async () => {
      const { rooms, server } = createServer();
      const gateway = buildGateway(server, membership);
      membership.getParticipantIds.mockResolvedValue(["user-2", "user-3"]);

      await gateway.handleTyping(createClient("user-1"), { conversationId: "11111111-1111-1111-1111-111111111111", isTyping: true });

      expect(rooms.size).toBe(0);
    });
  });

  describe("emit helpers", () => {
    const message = { conversationId: "c1", id: "m1" } as MessageDto;

    it("emits message:new to every recipient room", () => {
      const { rooms, server } = createServer();
      const gateway = buildGateway(server, membership);

      gateway.emitNewMessage(["user-1", "user-2"], message);

      expect(rooms.get("user:user-1")?.emit).toHaveBeenCalledWith("message:new", message);
      expect(rooms.get("user:user-2")?.emit).toHaveBeenCalledWith("message:new", message);
    });

    it("emits message:deleted to every recipient room", () => {
      const { rooms, server } = createServer();
      const gateway = buildGateway(server, membership);

      gateway.emitMessageDeleted(["user-1"], message);

      expect(rooms.get("user:user-1")?.emit).toHaveBeenCalledWith("message:deleted", message);
    });

    it("emits message:read to the counterpart room", () => {
      const { rooms, server } = createServer();
      const gateway = buildGateway(server, membership);
      const event = { conversationId: "c1", readAt: "2026-06-08T00:00:00.000Z", userId: "user-1" } as MessageReadEvent;

      gateway.emitMessageRead("user-2", event);

      expect(rooms.get("user:user-2")?.emit).toHaveBeenCalledWith("message:read", event);
    });
  });
});

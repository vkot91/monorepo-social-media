import { ForbiddenException, NotFoundException } from "@nestjs/common";
import { FriendshipStatus } from "@social/database";

import { PaginationService } from "#common/pagination/pagination.service";
import { mockedPrisma } from "#test/prisma.mock";

import { MessagingService } from "./messaging.service";

const conversationRecord = {
  createdAt: new Date("2026-06-01T00:00:00.000Z"),
  id: "conv-1",
  lastMessageAt: null,
  messages: [],
  pairKey: "user-1:user-2",
  participants: [
    {
      conversationId: "conv-1",
      lastReadAt: null,
      user: { avatarUrl: null, displayName: "User One", id: "user-1", username: "userone" },
      userId: "user-1",
    },
    {
      conversationId: "conv-1",
      lastReadAt: null,
      user: { avatarUrl: null, displayName: "User Two", id: "user-2", username: "usertwo" },
      userId: "user-2",
    },
  ],
  updatedAt: new Date("2026-06-01T00:00:00.000Z"),
};

const messageRecord = {
  content: "Hello",
  conversationId: "conv-1",
  createdAt: new Date("2026-06-02T00:00:00.000Z"),
  deletedAt: null,
  id: "msg-1",
  senderId: "user-1",
};

const acceptedFriendship = {
  addresseeId: "user-2",
  createdAt: new Date("2026-05-01T00:00:00.000Z"),
  id: "friendship-1",
  requesterId: "user-1",
  status: FriendshipStatus.ACCEPTED,
  updatedAt: new Date("2026-05-01T00:00:00.000Z"),
};

function createService() {
  mockedPrisma.$transaction.mockImplementation((async (callback) => {
    if (typeof callback === "function") {
      return callback(mockedPrisma);
    }

    return Promise.all(callback);
  }) as typeof mockedPrisma.$transaction);

  mockedPrisma.friendship.findFirst.mockResolvedValue(acceptedFriendship);
  mockedPrisma.userBlock.findFirst.mockResolvedValue(null);
  mockedPrisma.conversation.upsert.mockResolvedValue(conversationRecord as never);
  mockedPrisma.conversation.findMany.mockResolvedValue([conversationRecord] as never);
  mockedPrisma.conversation.update.mockResolvedValue(conversationRecord as never);
  mockedPrisma.conversationParticipant.findUnique.mockResolvedValue({
    conversationId: "conv-1",
    lastReadAt: null,
    userId: "user-1",
  } as never);
  mockedPrisma.conversationParticipant.findFirst.mockResolvedValue({ userId: "user-2" } as never);
  mockedPrisma.conversationParticipant.update.mockResolvedValue({} as never);
  mockedPrisma.message.count.mockResolvedValue(0);
  mockedPrisma.message.findMany.mockResolvedValue([messageRecord] as never);
  mockedPrisma.message.create.mockResolvedValue(messageRecord as never);
  mockedPrisma.message.findUnique.mockResolvedValue(messageRecord as never);
  mockedPrisma.message.update.mockResolvedValue({ ...messageRecord, deletedAt: new Date() } as never);

  return { prisma: mockedPrisma, service: new MessagingService(new PaginationService()) };
}

describe("MessagingService", () => {
  describe("startConversation", () => {
    it("throws ForbiddenException when messaging yourself", async () => {
      const { service } = createService();

      await expect(service.startConversation("user-1", "user-1")).rejects.toBeInstanceOf(
        ForbiddenException,
      );
    });

    it("throws ForbiddenException when users are not accepted friends", async () => {
      const { prisma, service } = createService();
      prisma.friendship.findFirst.mockResolvedValue(null);

      await expect(service.startConversation("user-1", "user-2")).rejects.toBeInstanceOf(
        ForbiddenException,
      );
      expect(prisma.conversation.upsert).not.toHaveBeenCalled();
    });

    it("throws ForbiddenException when a block exists", async () => {
      const { prisma, service } = createService();
      prisma.userBlock.findFirst.mockResolvedValue({
        blockedId: "user-2",
        blockerId: "user-1",
        createdAt: new Date(),
      });

      await expect(service.startConversation("user-1", "user-2")).rejects.toBeInstanceOf(
        ForbiddenException,
      );
      expect(prisma.conversation.upsert).not.toHaveBeenCalled();
    });

    it("upserts by canonical pairKey so a:b and b:a map to one conversation", async () => {
      const { prisma, service } = createService();

      await service.startConversation("user-2", "user-1");

      expect(prisma.conversation.upsert).toHaveBeenCalledWith(
        expect.objectContaining({ where: { pairKey: "user-1:user-2" } }),
      );
    });

    it("returns a serialized conversation with participant and unreadCount", async () => {
      const { service } = createService();

      const result = await service.startConversation("user-1", "user-2");

      expect(result).toMatchObject({
        id: "conv-1",
        participant: { id: "user-2", username: "usertwo" },
        unreadCount: 0,
      });
    });
  });

  describe("listConversations", () => {
    it("returns all conversations the user participates in, ordered by lastMessageAt", async () => {
      const { prisma, service } = createService();

      const result = await service.listConversations("user-1");

      expect(prisma.conversation.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          orderBy: { lastMessageAt: "desc" },
          where: { participants: { some: { userId: "user-1" } } },
        }),
      );
      expect(result).toHaveLength(1);
      expect(result[0]).toMatchObject({ id: "conv-1", participant: { id: "user-2" } });
    });

    it("returns an empty array when the user has no conversations", async () => {
      const { prisma, service } = createService();
      prisma.conversation.findMany.mockResolvedValue([]);

      const result = await service.listConversations("user-1");

      expect(result).toEqual([]);
    });

    it("includes unread count per conversation", async () => {
      const { prisma, service } = createService();
      prisma.message.count.mockResolvedValue(3);

      const result = await service.listConversations("user-1");

      expect(result[0]!.unreadCount).toBe(3);
    });
  });

  describe("listMessages", () => {
    it("throws NotFoundException when the user is not a participant", async () => {
      const { prisma, service } = createService();
      prisma.conversationParticipant.findUnique.mockResolvedValue(null);

      await expect(service.listMessages("user-1", "conv-1", {})).rejects.toBeInstanceOf(
        NotFoundException,
      );
    });

    it("returns serialized messages with pageInfo when no cursor provided", async () => {
      const { service } = createService();

      const result = await service.listMessages("user-1", "conv-1", {});

      expect(result.items).toHaveLength(1);
      expect(result.items[0]).toMatchObject({ id: "msg-1", content: "Hello" });
      expect(result.pageInfo).toMatchObject({ mode: "cursor", hasNextPage: false });
    });

    it("fetches one extra item to determine hasNextPage", async () => {
      const { prisma, service } = createService();
      const limit = 2;
      const records = [messageRecord, { ...messageRecord, id: "msg-2" }, { ...messageRecord, id: "msg-3" }];
      prisma.message.findMany.mockResolvedValue(records as never);

      const result = await service.listMessages("user-1", "conv-1", { limit });

      expect(result.items).toHaveLength(2);
      expect(result.pageInfo.hasNextPage).toBe(true);
    });

    it("decodes cursor and applies createdAt/id bounds to the where clause", async () => {
      const { prisma, service } = createService();
      const cursorPayload = { createdAt: "2026-06-02T00:00:00.000Z", id: "msg-1", version: 1 };
      const cursor = Buffer.from(JSON.stringify(cursorPayload), "utf8").toString("base64url");

      await service.listMessages("user-1", "conv-1", { cursor });

      expect(prisma.message.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({ AND: expect.any(Array) }),
        }),
      );
    });
  });

  describe("sendMessage", () => {
    it("persists, bumps lastMessageAt, and marks sender read", async () => {
      const { prisma, service } = createService();

      const result = await service.sendMessage("user-1", "conv-1", "Hello");

      expect(prisma.message.create).toHaveBeenCalledWith({
        data: { content: "Hello", conversationId: "conv-1", senderId: "user-1" },
      });
      expect(prisma.conversation.update).toHaveBeenCalledWith({
        data: { lastMessageAt: messageRecord.createdAt },
        where: { id: "conv-1" },
      });
      expect(prisma.conversationParticipant.update).toHaveBeenCalledWith({
        data: { lastReadAt: messageRecord.createdAt },
        where: { conversationId_userId: { conversationId: "conv-1", userId: "user-1" } },
      });
      expect(result).toMatchObject({ content: "Hello", id: "msg-1" });
    });

    it("throws NotFoundException when the user is not a participant", async () => {
      const { prisma, service } = createService();
      prisma.conversationParticipant.findUnique.mockResolvedValue(null);

      await expect(service.sendMessage("user-1", "conv-1", "Hi")).rejects.toBeInstanceOf(
        NotFoundException,
      );
    });
  });

  describe("deleteMessage", () => {
    it("throws NotFoundException for a missing message", async () => {
      const { prisma, service } = createService();
      prisma.message.findUnique.mockResolvedValue(null);

      await expect(service.deleteMessage("user-1", "msg-1")).rejects.toBeInstanceOf(NotFoundException);
    });

    it("throws ForbiddenException when deleting someone else's message", async () => {
      const { prisma, service } = createService();
      prisma.message.findUnique.mockResolvedValue({ ...messageRecord, senderId: "user-2" } as never);

      await expect(service.deleteMessage("user-1", "msg-1")).rejects.toBeInstanceOf(ForbiddenException);
      expect(prisma.message.update).not.toHaveBeenCalled();
    });

    it("soft-deletes an owned message and blanks its content in the response", async () => {
      const { service } = createService();

      const result = await service.deleteMessage("user-1", "msg-1");

      expect(result.deletedAt).not.toBeNull();
      expect(result.content).toBe("");
    });

    it("is idempotent — returns immediately without a second update when message is already deleted", async () => {
      const { prisma, service } = createService();
      const alreadyDeleted = { ...messageRecord, deletedAt: new Date("2026-06-03T00:00:00.000Z") };
      prisma.message.findUnique.mockResolvedValue(alreadyDeleted as never);

      const result = await service.deleteMessage("user-1", "msg-1");

      expect(prisma.message.update).not.toHaveBeenCalled();
      expect(result.deletedAt).not.toBeNull();
    });
  });

  describe("markRead", () => {
    it("updates lastReadAt and returns a read event", async () => {
      const { prisma, service } = createService();

      const result = await service.markRead("user-1", "conv-1");

      expect(prisma.conversationParticipant.update).toHaveBeenCalledWith({
        data: { lastReadAt: expect.any(Date) },
        where: { conversationId_userId: { conversationId: "conv-1", userId: "user-1" } },
      });
      expect(result).toMatchObject({ conversationId: "conv-1", userId: "user-1" });
      expect(typeof result.readAt).toBe("string");
    });

    it("throws NotFoundException when the user is not a participant", async () => {
      const { prisma, service } = createService();
      prisma.conversationParticipant.findUnique.mockResolvedValue(null);

      await expect(service.markRead("user-1", "conv-1")).rejects.toBeInstanceOf(NotFoundException);
    });
  });

  describe("getCounterpartId", () => {
    it("returns the other participant's userId", async () => {
      const { service } = createService();

      const result = await service.getCounterpartId("conv-1", "user-1");

      expect(result).toBe("user-2");
    });

    it("throws NotFoundException when the conversation or counterpart does not exist", async () => {
      const { prisma, service } = createService();
      prisma.conversationParticipant.findFirst.mockResolvedValue(null);

      await expect(service.getCounterpartId("conv-1", "user-1")).rejects.toBeInstanceOf(NotFoundException);
    });
  });
});

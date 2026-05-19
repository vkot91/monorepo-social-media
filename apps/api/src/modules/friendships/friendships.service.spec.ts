import { BadRequestException, ForbiddenException, NotFoundException } from "@nestjs/common";
import { FriendshipStatus } from "@social/database";

import { buildAuthUserRecord } from "#test/factories/auth.factory";
import {
  buildFriendshipDto,
  buildFriendshipRecord,
  buildUserBlockDto,
  buildUserBlockRecord,
} from "#test/factories/friendship.factory";
import { mockedPrisma } from "#test/prisma.mock";

import { FriendshipsService } from "./friendships.service";

const persistedFriendship = buildFriendshipRecord();
const persistedBlock = buildUserBlockRecord();

function createService() {
  mockedPrisma.user.findUnique.mockResolvedValue(buildAuthUserRecord({ id: "user-2" }));
  mockedPrisma.friendship.findFirst.mockResolvedValue(null);
  mockedPrisma.friendship.findUnique.mockResolvedValue(persistedFriendship);
  mockedPrisma.friendship.create.mockResolvedValue(persistedFriendship);
  mockedPrisma.friendship.update.mockResolvedValue(
    buildFriendshipRecord({
      status: FriendshipStatus.ACCEPTED,
      updatedAt: new Date("2026-05-06T12:00:00.000Z"),
    }),
  );
  mockedPrisma.friendship.delete.mockResolvedValue(persistedFriendship);
  mockedPrisma.userBlock.upsert.mockResolvedValue(persistedBlock);
  mockedPrisma.userBlock.deleteMany.mockResolvedValue({
    count: 1,
  });

  return {
    prisma: mockedPrisma,
    service: new FriendshipsService(),
  };
}

describe("FriendshipsService", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("creates a pending friend request", async () => {
    const { prisma, service } = createService();

    await expect(
      service.sendRequest("user-1", {
        targetUserId: "user-2",
      }),
    ).resolves.toEqual(buildFriendshipDto());

    expect(prisma.friendship.create).toHaveBeenCalledWith({
      data: {
        addresseeId: "user-2",
        requesterId: "user-1",
      },
    });
  });

  it("rejects friend requests to self", async () => {
    const { prisma, service } = createService();

    await expect(
      service.sendRequest("user-1", {
        targetUserId: "user-1",
      }),
    ).rejects.toBeInstanceOf(BadRequestException);
    expect(prisma.user.findUnique).not.toHaveBeenCalled();
  });

  it("throws not found when the addressee does not exist", async () => {
    const { prisma, service } = createService();
    prisma.user.findUnique.mockResolvedValue(null);

    await expect(
      service.sendRequest("user-1", {
        targetUserId: "user-2",
      }),
    ).rejects.toBeInstanceOf(NotFoundException);
    expect(prisma.friendship.create).not.toHaveBeenCalled();
  });

  it("returns an existing pending relationship for the unordered user pair", async () => {
    const { prisma, service } = createService();
    prisma.friendship.findFirst.mockResolvedValue({
      ...persistedFriendship,
      addresseeId: "user-1",
      requesterId: "user-2",
    });

    const result = await service.sendRequest("user-1", {
      targetUserId: "user-2",
    });

    expect(result).toMatchObject({
      addresseeId: "user-1",
      requesterId: "user-2",
      status: "PENDING",
    });
    expect(prisma.friendship.create).not.toHaveBeenCalled();
  });

  it("reuses a rejected relationship as a new pending request", async () => {
    const { prisma, service } = createService();
    prisma.friendship.findFirst.mockResolvedValue({
      ...persistedFriendship,
      addresseeId: "user-1",
      requesterId: "user-2",
      status: FriendshipStatus.REJECTED,
    });

    await service.sendRequest("user-1", {
      targetUserId: "user-2",
    });

    expect(prisma.friendship.update).toHaveBeenCalledWith({
      data: {
        addresseeId: "user-2",
        requesterId: "user-1",
        status: FriendshipStatus.PENDING,
      },
      where: {
        id: "friendship-1",
      },
    });
  });

  it("accepts a pending request by the addressee", async () => {
    const { prisma, service } = createService();

    await expect(
      service.updateRequest("user-2", "friendship-1", "ACCEPTED"),
    ).resolves.toMatchObject({
      status: "ACCEPTED",
    });

    expect(prisma.friendship.update).toHaveBeenCalledWith({
      data: {
        status: FriendshipStatus.ACCEPTED,
      },
      where: {
        id: "friendship-1",
      },
    });
  });

  it("rejects accept attempts from users who are not the addressee", async () => {
    const { prisma, service } = createService();

    await expect(
      service.updateRequest("user-3", "friendship-1", "ACCEPTED"),
    ).rejects.toBeInstanceOf(ForbiddenException);
    expect(prisma.friendship.update).not.toHaveBeenCalled();
  });

  it("rejects non-pending request mutations", async () => {
    const { service, prisma } = createService();
    prisma.friendship.findUnique.mockResolvedValue({
      ...persistedFriendship,
      status: FriendshipStatus.ACCEPTED,
    });

    await expect(
      service.updateRequest("user-2", "friendship-1", "REJECTED"),
    ).rejects.toBeInstanceOf(BadRequestException);
  });

  it("rejects a pending request by the addressee", async () => {
    const { prisma, service } = createService();

    await service.updateRequest("user-2", "friendship-1", "REJECTED");

    expect(prisma.friendship.update).toHaveBeenCalledWith({
      data: {
        status: FriendshipStatus.REJECTED,
      },
      where: {
        id: "friendship-1",
      },
    });
  });

  it("cancels a pending request by the requester", async () => {
    const { prisma, service } = createService();

    await service.updateRequest("user-1", "friendship-1", "CANCELED");

    expect(prisma.friendship.delete).toHaveBeenCalledWith({
      where: {
        id: "friendship-1",
      },
    });
  });

  it("rejects cancel attempts from users who are not the requester", async () => {
    const { prisma, service } = createService();

    await expect(
      service.updateRequest("user-2", "friendship-1", "CANCELED"),
    ).rejects.toBeInstanceOf(ForbiddenException);
    expect(prisma.friendship.delete).not.toHaveBeenCalled();
  });

  it("removes an accepted friendship by the requester", async () => {
    const { prisma, service } = createService();
    prisma.friendship.findUnique.mockResolvedValue({
      ...persistedFriendship,
      status: FriendshipStatus.ACCEPTED,
    });

    await service.removeFriendship("user-1", "friendship-1");

    expect(prisma.friendship.delete).toHaveBeenCalledWith({
      where: {
        id: "friendship-1",
      },
    });
  });

  it("removes an accepted friendship by the addressee", async () => {
    const { prisma, service } = createService();
    prisma.friendship.findUnique.mockResolvedValue({
      ...persistedFriendship,
      status: FriendshipStatus.ACCEPTED,
    });

    await service.removeFriendship("user-2", "friendship-1");

    expect(prisma.friendship.delete).toHaveBeenCalledWith({
      where: {
        id: "friendship-1",
      },
    });
  });

  it("rejects friendship removal by non-participants", async () => {
    const { prisma, service } = createService();
    prisma.friendship.findUnique.mockResolvedValue({
      ...persistedFriendship,
      status: FriendshipStatus.ACCEPTED,
    });

    await expect(service.removeFriendship("user-3", "friendship-1")).rejects.toBeInstanceOf(
      ForbiddenException,
    );
    expect(prisma.friendship.delete).not.toHaveBeenCalled();
  });

  it("rejects friendship removal when the friendship does not exist", async () => {
    const { prisma, service } = createService();
    prisma.friendship.findUnique.mockResolvedValue(null);

    await expect(service.removeFriendship("user-1", "friendship-1")).rejects.toBeInstanceOf(
      NotFoundException,
    );
    expect(prisma.friendship.delete).not.toHaveBeenCalled();
  });

  it("rejects friendship removal for non-accepted friendships", async () => {
    const { prisma, service } = createService();

    await expect(service.removeFriendship("user-1", "friendship-1")).rejects.toBeInstanceOf(
      BadRequestException,
    );
    expect(prisma.friendship.delete).not.toHaveBeenCalled();
  });

  it("creates a directional user block", async () => {
    const { prisma, service } = createService();

    await expect(
      service.blockUser("user-1", {
        targetUserId: "user-2",
      }),
    ).resolves.toEqual(buildUserBlockDto());

    expect(prisma.userBlock.upsert).toHaveBeenCalledWith({
      create: {
        blockedId: "user-2",
        blockerId: "user-1",
      },
      update: {},
      where: {
        blockerId_blockedId: {
          blockedId: "user-2",
          blockerId: "user-1",
        },
      },
    });
  });

  it("rejects blocking self", async () => {
    const { prisma, service } = createService();

    await expect(
      service.blockUser("user-1", {
        targetUserId: "user-1",
      }),
    ).rejects.toBeInstanceOf(BadRequestException);
    expect(prisma.userBlock.upsert).not.toHaveBeenCalled();
  });

  it("removes a directional user block", async () => {
    const { prisma, service } = createService();

    await service.unblockUser("user-1", "user-2");

    expect(prisma.userBlock.deleteMany).toHaveBeenCalledWith({
      where: {
        blockedId: "user-2",
        blockerId: "user-1",
      },
    });
  });

  it("rejects unblock attempts of self", async () => {
    const { prisma, service } = createService();

    await expect(service.unblockUser("user-1", "user-1")).rejects.toBeInstanceOf(
      BadRequestException,
    );
    expect(prisma.userBlock.deleteMany).not.toHaveBeenCalled();
  });

  it("rejects not pending requests if friendship status is not pending", async () => {
    const { prisma, service } = createService();

    prisma.friendship.findUnique.mockResolvedValue({
      ...persistedFriendship,
      status: FriendshipStatus.ACCEPTED,
    });

    await expect(
      service.updateRequest("user-2", "friendship-1", "REJECTED"),
    ).rejects.toBeInstanceOf(BadRequestException);

    expect(prisma.friendship.update).not.toHaveBeenCalled();
  });
});

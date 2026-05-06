import { BadRequestException, ForbiddenException, NotFoundException } from "@nestjs/common";
import { FriendshipStatus, prisma } from "@social/database";

import { FriendshipsService } from "./friendships.service";

jest.mock("@social/database", () => ({
  FriendshipStatus: {
    ACCEPTED: "ACCEPTED",
    PENDING: "PENDING",
    REJECTED: "REJECTED",
  },
  prisma: {
    friendship: {
      create: jest.fn(),
      delete: jest.fn(),
      findFirst: jest.fn(),
      findUnique: jest.fn(),
      update: jest.fn(),
    },
    user: {
      findUnique: jest.fn(),
    },
    userBlock: {
      deleteMany: jest.fn(),
      upsert: jest.fn(),
    },
  },
}));

const persistedFriendship = {
  addresseeId: "user-2",
  createdAt: new Date("2026-05-06T10:00:00.000Z"),
  id: "friendship-1",
  requesterId: "user-1",
  status: FriendshipStatus.PENDING,
  updatedAt: new Date("2026-05-06T10:00:00.000Z"),
};

const persistedBlock = {
  blockedId: "user-2",
  blockerId: "user-1",
  createdAt: new Date("2026-05-06T11:00:00.000Z"),
};

type MockedPrisma = {
  friendship: {
    create: jest.Mock;
    delete: jest.Mock;
    findFirst: jest.Mock;
    findUnique: jest.Mock;
    update: jest.Mock;
  };
  user: {
    findUnique: jest.Mock;
  };
  userBlock: {
    deleteMany: jest.Mock;
    upsert: jest.Mock;
  };
};

function createService() {
  const mockedPrisma = prisma as unknown as MockedPrisma;

  mockedPrisma.user.findUnique.mockResolvedValue({
    id: "user-2",
  });
  mockedPrisma.friendship.findFirst.mockResolvedValue(null);
  mockedPrisma.friendship.findUnique.mockResolvedValue(persistedFriendship);
  mockedPrisma.friendship.create.mockResolvedValue(persistedFriendship);
  mockedPrisma.friendship.update.mockImplementation(({ data }: { data: Record<string, unknown> }) =>
    Promise.resolve({
      ...persistedFriendship,
      ...data,
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
    ).resolves.toEqual({
      addresseeId: "user-2",
      createdAt: "2026-05-06T10:00:00.000Z",
      id: "friendship-1",
      requesterId: "user-1",
      status: "PENDING",
      updatedAt: "2026-05-06T10:00:00.000Z",
    });

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

  it("creates a directional user block", async () => {
    const { prisma, service } = createService();

    await expect(
      service.blockUser("user-1", {
        targetUserId: "user-2",
      }),
    ).resolves.toEqual({
      blockedId: "user-2",
      blockerId: "user-1",
      createdAt: "2026-05-06T11:00:00.000Z",
    });

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

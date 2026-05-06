import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from "@nestjs/common";
import type {
  FriendshipDto,
  FriendshipRequestStatus,
  TargetUserInput,
  UserBlockDto,
} from "@social/contracts";
import { FriendshipStatus, prisma, type Friendship, type UserBlock } from "@social/database";

@Injectable()
export class FriendshipsService {
  async sendRequest(requesterId: string, input: TargetUserInput): Promise<FriendshipDto> {
    const addresseeId = input.targetUserId;

    if (requesterId === addresseeId) {
      throw new BadRequestException("You cannot send a friend request to yourself");
    }

    await this.assertUserExists(addresseeId);

    const existing = await this.findFriendshipBetween(requesterId, addresseeId);

    if (!existing) {
      const friendship = await prisma.friendship.create({
        data: {
          addresseeId,
          requesterId,
        },
      });

      return serializeFriendship(friendship);
    }

    if (existing.status === FriendshipStatus.REJECTED) {
      const friendship = await prisma.friendship.update({
        data: {
          addresseeId,
          requesterId,
          status: FriendshipStatus.PENDING,
        },
        where: {
          id: existing.id,
        },
      });

      return serializeFriendship(friendship);
    }

    return serializeFriendship(existing);
  }

  async updateRequest(
    userId: string,
    friendshipId: string,
    status: FriendshipRequestStatus,
  ): Promise<FriendshipDto | void> {
    const friendship = await this.assertPendingRequest(friendshipId);

    if (status === "CANCELED") {
      if (friendship.requesterId !== userId) {
        throw new ForbiddenException("Only the requester can cancel this friend request");
      }

      await prisma.friendship.delete({
        where: {
          id: friendshipId,
        },
      });

      return;
    }

    if (friendship.addresseeId !== userId) {
      throw new ForbiddenException("Only the addressee can update this friend request");
    }

    return serializeFriendship(
      await prisma.friendship.update({
        data: {
          status: status === "ACCEPTED" ? FriendshipStatus.ACCEPTED : FriendshipStatus.REJECTED,
        },
        where: {
          id: friendshipId,
        },
      }),
    );
  }

  async blockUser(blockerId: string, input: TargetUserInput): Promise<UserBlockDto> {
    const blockedId = input.targetUserId;

    if (blockerId === blockedId) {
      throw new BadRequestException("You cannot block yourself");
    }

    await this.assertUserExists(blockedId);

    const block = await prisma.userBlock.upsert({
      create: {
        blockedId,
        blockerId,
      },
      update: {},
      where: {
        blockerId_blockedId: {
          blockedId,
          blockerId,
        },
      },
    });

    return serializeUserBlock(block);
  }

  async unblockUser(blockerId: string, blockedId: string): Promise<void> {
    if (blockerId === blockedId) {
      throw new BadRequestException("You cannot unblock yourself");
    }

    await prisma.userBlock.deleteMany({
      where: {
        blockedId,
        blockerId,
      },
    });
  }

  private async assertUserExists(userId: string): Promise<void> {
    const user = await prisma.user.findUnique({
      select: {
        id: true,
      },
      where: {
        id: userId,
      },
    });

    if (!user) {
      throw new NotFoundException("User not found");
    }
  }

  private async findFriendshipBetween(userId: string, otherUserId: string): Promise<Friendship | null> {
    return prisma.friendship.findFirst({
      where: {
        OR: [
          {
            addresseeId: otherUserId,
            requesterId: userId,
          },
          {
            addresseeId: userId,
            requesterId: otherUserId,
          },
        ],
      },
    });
  }

  private async assertPendingRequest(friendshipId: string): Promise<Friendship> {
    const friendship = await prisma.friendship.findUnique({
      where: {
        id: friendshipId,
      },
    });

    if (!friendship) {
      throw new NotFoundException("Friend request not found");
    }

    if (friendship.status !== FriendshipStatus.PENDING) {
      throw new BadRequestException("Friend request is not pending");
    }

    return friendship;
  }
}

function serializeFriendship(friendship: Friendship): FriendshipDto {
  return {
    addresseeId: friendship.addresseeId,
    createdAt: friendship.createdAt.toISOString(),
    id: friendship.id,
    requesterId: friendship.requesterId,
    status: friendship.status,
    updatedAt: friendship.updatedAt.toISOString(),
  };
}

function serializeUserBlock(userBlock: UserBlock): UserBlockDto {
  return {
    blockedId: userBlock.blockedId,
    blockerId: userBlock.blockerId,
    createdAt: userBlock.createdAt.toISOString(),
  };
}

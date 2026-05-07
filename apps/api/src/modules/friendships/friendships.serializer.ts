import type { FriendshipDto, UserBlockDto } from "@social/contracts";
import type { Friendship, UserBlock } from "@social/database";

export function serializeFriendship(friendship: Friendship): FriendshipDto {
  return {
    addresseeId: friendship.addresseeId,
    createdAt: friendship.createdAt.toISOString(),
    id: friendship.id,
    requesterId: friendship.requesterId,
    status: friendship.status,
    updatedAt: friendship.updatedAt.toISOString(),
  };
}

export function serializeUserBlock(userBlock: UserBlock): UserBlockDto {
  return {
    blockedId: userBlock.blockedId,
    blockerId: userBlock.blockerId,
    createdAt: userBlock.createdAt.toISOString(),
  };
}

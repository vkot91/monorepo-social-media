import type { FriendshipDto, UserBlockDto } from "@social/contracts";
import { type Friendship, FriendshipStatus, type UserBlock } from "@social/database";

import {
  serializeFriendship,
  serializeUserBlock,
} from "#modules/friendships/friendships.serializer";

export function buildFriendshipRecord(overrides: Partial<Friendship> = {}): Friendship {
  return {
    addresseeId: "user-2",
    createdAt: new Date("2026-05-06T10:00:00.000Z"),
    id: "friendship-1",
    requesterId: "user-1",
    status: FriendshipStatus.PENDING,
    updatedAt: new Date("2026-05-06T10:00:00.000Z"),
    ...overrides,
  };
}

export function buildFriendshipDto(overrides: Partial<FriendshipDto> = {}): FriendshipDto {
  return {
    ...serializeFriendship(buildFriendshipRecord()),
    ...overrides,
  };
}

export function buildUserBlockRecord(overrides: Partial<UserBlock> = {}): UserBlock {
  return {
    blockedId: "user-2",
    blockerId: "user-1",
    createdAt: new Date("2026-05-06T11:00:00.000Z"),
    ...overrides,
  };
}

export function buildUserBlockDto(overrides: Partial<UserBlockDto> = {}): UserBlockDto {
  return {
    ...serializeUserBlock(buildUserBlockRecord()),
    ...overrides,
  };
}

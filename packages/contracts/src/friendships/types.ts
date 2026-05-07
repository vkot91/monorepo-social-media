export type FriendshipStatus = "PENDING" | "ACCEPTED" | "REJECTED";
export type FriendshipRequestStatus = "ACCEPTED" | "REJECTED" | "CANCELED";

export type TargetUserInput = {
  targetUserId: string;
};

export type FriendshipRequestStatusInput = {
  status: FriendshipRequestStatus;
};

export type FriendshipDto = {
  id: string;
  requesterId: string;
  addresseeId: string;
  status: FriendshipStatus;
  createdAt: string;
  updatedAt: string;
};

export type UserBlockDto = {
  blockerId: string;
  blockedId: string;
  createdAt: string;
};

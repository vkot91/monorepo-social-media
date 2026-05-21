import type { z } from "zod";

import type { friendshipRequestStatusSchema, targetUserSchema } from "./schemas";

export type FriendshipStatus = "PENDING" | "ACCEPTED" | "REJECTED";

export type FriendshipRequestStatus = z.input<typeof friendshipRequestStatusSchema>["status"];

export type TargetUserInput = z.input<typeof targetUserSchema>;

export type FriendshipRequestStatusInput = z.input<typeof friendshipRequestStatusSchema>;

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

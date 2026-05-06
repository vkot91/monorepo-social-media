import { friendshipRequestStatusSchema, targetUserSchema } from "@social/contracts";

import { FriendshipsController } from "./friendships.controller";
import type { FriendshipsService } from "./friendships.service";

describe("FriendshipsController", () => {
  const friendshipsService = {
    blockUser: jest.fn(),
    sendRequest: jest.fn(),
    unblockUser: jest.fn(),
    updateRequest: jest.fn(),
  } as unknown as jest.Mocked<FriendshipsService>;

  const controller = new FriendshipsController(friendshipsService);
  const user = {
    email: "ada@example.com",
    sub: "user-1",
    type: "access" as const,
    username: "ada",
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("delegates friend request creation for the authenticated user", async () => {
    const input = {
      targetUserId: "11111111-1111-4111-8111-111111111112",
    };

    await controller.sendRequest(user, input);

    expect(friendshipsService.sendRequest).toHaveBeenCalledWith("user-1", input);
  });

  it("delegates request status updates for the authenticated user", async () => {
    await controller.updateRequest(user, "friendship-1", {
      status: "ACCEPTED",
    });

    expect(friendshipsService.updateRequest).toHaveBeenCalledWith(
      "user-1",
      "friendship-1",
      "ACCEPTED",
    );
  });

  it("delegates blocking for the authenticated user", async () => {
    const input = {
      targetUserId: "11111111-1111-4111-8111-111111111112",
    };

    await controller.blockUser(user, input);

    expect(friendshipsService.blockUser).toHaveBeenCalledWith("user-1", input);
  });

  it("delegates unblocking for the authenticated user", async () => {
    await controller.unblockUser(user, "user-2");

    expect(friendshipsService.unblockUser).toHaveBeenCalledWith("user-1", "user-2");
  });
});

describe("targetUserSchema", () => {
  it("accepts a UUID target user id", () => {
    expect(
      targetUserSchema.safeParse({
        targetUserId: "11111111-1111-4111-8111-111111111112",
      }).success,
    ).toBe(true);
  });

  it("rejects non-UUID target user ids", () => {
    expect(
      targetUserSchema.safeParse({
        targetUserId: "user-2",
      }).success,
    ).toBe(false);
  });
});

describe("friendshipRequestStatusSchema", () => {
  it("accepts accepted, rejected, and canceled statuses", () => {
    expect(friendshipRequestStatusSchema.safeParse({ status: "ACCEPTED" }).success).toBe(true);
    expect(friendshipRequestStatusSchema.safeParse({ status: "REJECTED" }).success).toBe(true);
    expect(friendshipRequestStatusSchema.safeParse({ status: "CANCELED" }).success).toBe(true);
  });

  it("rejects pending because pending is not a request action", () => {
    expect(friendshipRequestStatusSchema.safeParse({ status: "PENDING" }).success).toBe(false);
  });
});

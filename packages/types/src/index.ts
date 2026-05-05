import {
  User,
  Comment,
  Friendship,
  FriendshipStatus,
  Post,
  PostLike,
  PostVisibility,
} from "@social/database";

type SafeUser = Omit<User, "passwordHash">;

export type {
  SafeUser as User,
  Comment,
  Friendship,
  FriendshipStatus,
  Post,
  PostLike,
  PostVisibility,
};

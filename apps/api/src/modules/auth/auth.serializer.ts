import type { AuthUserDto } from "@social/contracts";
import type { Prisma } from "@social/database";

export const authUserSelect = {
  avatarUrl: true,
  bio: true,
  createdAt: true,
  displayName: true,
  email: true,
  id: true,
  username: true,
} as const satisfies Prisma.UserSelect;

export type AuthUserRecord = Prisma.UserGetPayload<{
  select: typeof authUserSelect;
}>;

export function serializeAuthUser(user: AuthUserRecord): AuthUserDto {
  return {
    avatarUrl: user.avatarUrl,
    bio: user.bio,
    createdAt: user.createdAt.toISOString(),
    displayName: user.displayName,
    email: user.email,
    id: user.id,
    username: user.username,
  };
}

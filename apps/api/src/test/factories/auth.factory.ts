import type { AuthUserDto } from "@social/contracts";
import type { RefreshToken, User } from "@social/database";

import { serializeAuthUser } from "#modules/auth/auth.serializer";
import type { AuthTokenPayload } from "#modules/auth/types/auth-token-payload";

export type StoredRefreshTokenRecord = RefreshToken & {
  user?: User;
};

export function buildAuthUserRecord(overrides: Partial<User> = {}): User {
  return {
    avatarUrl: null,
    bio: null,
    createdAt: new Date("2026-05-05T10:00:00.000Z"),
    displayName: "Ada Lovelace",
    email: "ada@example.com",
    id: "user-1",
    passwordHash: "hashed-password",
    updatedAt: new Date("2026-05-05T10:00:00.000Z"),
    username: "ada",
    ...overrides,
  };
}

export function buildAuthUserDto(overrides: Partial<AuthUserDto> = {}): AuthUserDto {
  return {
    ...serializeAuthUser(buildAuthUserRecord()),
    ...overrides,
  };
}

export function buildRefreshPayload(overrides: Partial<AuthTokenPayload> = {}): AuthTokenPayload {
  return {
    email: "ada@example.com",
    jti: "refresh-token-1",
    sub: "user-1",
    type: "refresh",
    username: "ada",
    ...overrides,
  };
}

export function buildStoredRefreshTokenRecord(
  overrides: Partial<StoredRefreshTokenRecord> = {},
): StoredRefreshTokenRecord {
  const user = overrides.user ?? buildAuthUserRecord();

  return {
    createdAt: new Date("2026-05-05T10:00:00.000Z"),
    expiresAt: new Date("2026-05-06T12:00:00.000Z"),
    id: "refresh-token-1",
    revokedAt: null,
    tokenHash: "stored-hash",
    user,
    userId: user.id,
    ...overrides,
  };
}

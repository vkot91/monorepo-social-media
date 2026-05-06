import type { z } from "zod";

import type { loginSchema, logoutSchema, refreshTokenSchema, registerSchema } from "./schemas";

export type AuthUserDto = {
  avatarUrl: string | null;
  bio: string | null;
  createdAt: string;
  displayName: string;
  email: string;
  id: string;
  username: string;
};

export type AuthTokens = {
  accessToken: string;
  refreshToken: string;
};

export type AuthResponse = AuthTokens & {
  user: AuthUserDto;
};

export type RegisterInput = z.infer<typeof registerSchema>;
export type LoginInput = z.infer<typeof loginSchema>;
export type RefreshTokenInput = z.infer<typeof refreshTokenSchema>;
export type LogoutInput = z.infer<typeof logoutSchema>;

import type { z } from "zod";

import type {
  AuthResponseSchema,
  AuthUserSchema,
  loginSchema,
  logoutSchema,
  refreshTokenSchema,
  registerSchema,
} from "./schemas";

export type AuthUserDto = z.infer<typeof AuthUserSchema>;

export type AuthTokens = z.infer<typeof AuthResponseSchema>;

export type AuthResponse = AuthTokens;

export type RegisterInput = z.input<typeof registerSchema>;

export type LoginInput = z.input<typeof loginSchema>;

export type RefreshTokenInput = z.input<typeof refreshTokenSchema>;

export type LogoutInput = z.input<typeof logoutSchema>;

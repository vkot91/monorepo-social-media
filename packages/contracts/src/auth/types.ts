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

export type RegisterInput = {
  displayName: string;
  email: string;
  password: string;
  username: string;
};

export type LoginInput = {
  email: string;
  password: string;
};

export type RefreshTokenInput = {
  refreshToken: string;
};

export type LogoutInput = RefreshTokenInput;

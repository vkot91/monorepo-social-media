export type TokenType = "access" | "refresh";

export type AuthTokenPayload = {
  email: string;
  jti?: string;
  sub: string;
  type: TokenType;
  username: string;
};

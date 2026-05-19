export const authUser = {
  avatarUrl: null,
  bio: null,
  createdAt: "2026-05-07T10:00:00.000Z",
  displayName: "Maya Johnson",
  email: "maya@example.com",
  id: "user-1",
  username: "maya",
};

export const authTokens = {
  accessToken: "e2e.eyJleHAiOjQxMDI0NDQ4MDAsInNjZW5hcmlvIjoicG9zdHMifQ.signature",
  refreshToken: "refresh-token",
};

export const authResponse = {
  ...authTokens,
};

export const authErrors = {
  emailAlreadyExists: { message: "Email already exists" },
  invalidCredentials: { message: "Invalid credentials" },
};

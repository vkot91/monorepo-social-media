import type { ExecutionContext } from "@nestjs/common";

import { currentUserFactory } from "./current-user.decorator";

function createContext(request: Record<string, unknown>) {
  return {
    switchToHttp: jest.fn(() => ({
      getRequest: jest.fn(() => request),
    })),
  } as unknown as ExecutionContext;
}

describe("CurrentUser", () => {
  it("returns the authenticated user payload from the request", () => {
    const user = {
      email: "ada@example.com",
      sub: "user-1",
      type: "access" as const,
      username: "ada",
    };

    expect(currentUserFactory(undefined, createContext({ user }))).toBe(user);
  });
});

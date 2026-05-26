import { env } from "#config/env";

import { delay } from "./delay";

jest.mock("#config/env", () => ({
  env: {
    NODE_ENV: "development",
  },
}));

describe("delay", () => {
  beforeEach(() => {
    env.NODE_ENV = "development";
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it("resolves after the requested duration", async () => {
    const result = delay(50);
    let settled = false;

    if (!result) {
      throw new Error("Expected delay to return a promise in development.");
    }

    void result.then(() => {
      settled = true;
    });

    await jest.advanceTimersByTimeAsync(49);
    expect(settled).toBe(false);

    await jest.advanceTimersByTimeAsync(1);
    await expect(result).resolves.toBeUndefined();
  });

  it("does not schedule a timer outside development", () => {
    env.NODE_ENV = "test";

    expect(delay(50)).toBeUndefined();
    expect(jest.getTimerCount()).toBe(0);
  });
});

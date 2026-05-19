import { delay } from "./delay";

describe("delay", () => {
  beforeEach(() => {
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it("resolves after the requested duration", async () => {
    const result = delay(50);
    let settled = false;

    void result.then(() => {
      settled = true;
    });

    await jest.advanceTimersByTimeAsync(49);
    expect(settled).toBe(false);

    await jest.advanceTimersByTimeAsync(1);
    await expect(result).resolves.toBeUndefined();
  });
});

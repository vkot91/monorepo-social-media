import { getRequestDurationMs } from "./request-duration";

describe("getRequestDurationMs", () => {
  it("returns elapsed milliseconds when a request start timestamp exists", () => {
    jest.spyOn(Date, "now").mockReturnValue(150);

    expect(
      getRequestDurationMs({
        requestStartedAt: 100,
        url: "/posts",
      }),
    ).toBe(50);
  });

  it("returns undefined without a request start timestamp", () => {
    expect(
      getRequestDurationMs({
        url: "/posts",
      }),
    ).toBeUndefined();
  });
});

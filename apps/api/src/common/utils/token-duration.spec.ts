import { durationToMilliseconds } from "./token-duration";

describe("durationToMilliseconds", () => {
  it.each([
    ["500ms", 500],
    ["15s", 15_000],
    ["15m", 900_000],
    ["2h", 7_200_000],
    ["30d", 2_592_000_000],
  ])("parses %s", (duration, expected) => {
    expect(durationToMilliseconds(duration)).toBe(expected);
  });

  it("rejects unsupported formats", () => {
    expect(() => durationToMilliseconds("1 month")).toThrow("Unsupported duration format");
  });
});

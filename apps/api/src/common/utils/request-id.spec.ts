import { getRequestId } from "./request-id";

describe("getRequestId", () => {
  it("returns the inbound request id when present", () => {
    expect(
      getRequestId({
        headers: {
          "x-request-id": "request-123",
        },
      }),
    ).toBe("request-123");
  });

  it("generates a fallback request id when none is present", () => {
    expect(getRequestId({})).toEqual(expect.any(String));
  });
});

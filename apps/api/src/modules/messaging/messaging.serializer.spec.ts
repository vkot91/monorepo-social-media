import { buildPairKey, serializeMessage } from "./messaging.serializer";

describe("messaging serializer", () => {
  it("builds a canonical pair key regardless of argument order", () => {
    expect(buildPairKey("b", "a")).toBe("a:b");
    expect(buildPairKey("a", "b")).toBe("a:b");
  });

  it("blanks content for deleted messages", () => {
    const deletedAt = new Date("2026-06-04T00:00:00.000Z");
    const result = serializeMessage({
      content: "secret",
      conversationId: "c1",
      createdAt: new Date("2026-06-03T00:00:00.000Z"),
      deletedAt,
      id: "m1",
      senderId: "u1",
    });
    expect(result.content).toBe("");
    expect(result.deletedAt).toBe(deletedAt.toISOString());
  });
});

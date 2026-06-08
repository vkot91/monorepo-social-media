const store = new Map<string, string>();

const redisGet = jest.fn(async (key: string) => store.get(key) ?? null);
const redisSet = jest.fn(async (key: string, value: string) => {
  store.set(key, value);

  return "OK";
});

jest.mock("ioredis", () =>
  jest.fn().mockImplementation(() => ({
    get: redisGet,
    quit: jest.fn(async () => "OK"),
    set: redisSet,
  })),
);

const findMany = jest.fn();

jest.mock("@social/database", () => ({
  prisma: { conversationParticipant: { findMany: (...args: unknown[]) => findMany(...args) } },
}));

// eslint-disable-next-line import/first -- imports must follow the jest.mock calls above
import { ConversationMembershipService } from "./conversation-membership.service";

describe("ConversationMembershipService", () => {
  beforeEach(() => {
    store.clear();
    jest.clearAllMocks();
  });

  it("loads participant ids from the database on a cache miss and caches them", async () => {
    findMany.mockResolvedValue([{ userId: "u1" }, { userId: "u2" }]);
    const service = new ConversationMembershipService();

    await expect(service.getParticipantIds("conv-1")).resolves.toEqual(["u1", "u2"]);
    expect(findMany).toHaveBeenCalledTimes(1);
    expect(redisSet).toHaveBeenCalledWith("conversation:conv-1:participants", JSON.stringify(["u1", "u2"]), "EX", 300);
  });

  it("serves a cache hit without touching the database", async () => {
    store.set("conversation:conv-1:participants", JSON.stringify(["u1", "u2"]));
    const service = new ConversationMembershipService();

    await expect(service.getParticipantIds("conv-1")).resolves.toEqual(["u1", "u2"]);
    expect(findMany).not.toHaveBeenCalled();
  });

  it("does not cache an empty participant list", async () => {
    findMany.mockResolvedValue([]);
    const service = new ConversationMembershipService();

    await expect(service.getParticipantIds("missing")).resolves.toEqual([]);
    expect(redisSet).not.toHaveBeenCalled();
  });

  it("closes the Redis connection on module destroy", async () => {
    const service = new ConversationMembershipService();
    await expect(service.onModuleDestroy()).resolves.not.toThrow();
  });
});

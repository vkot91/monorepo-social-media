const sets = new Map<string, Set<string>>();
const expireCalls: Array<[string, number]> = [];

const getSet = (key: string): Set<string> => {
  const existing = sets.get(key);

  if (existing) {
    return existing;
  }

  const created = new Set<string>();
  sets.set(key, created);

  return created;
};

jest.mock("ioredis", () =>
  jest.fn().mockImplementation(() => ({
    del: jest.fn(async (key: string) => {
      sets.delete(key);

      return 1;
    }),
    expire: jest.fn(async (key: string, seconds: number) => {
      expireCalls.push([key, seconds]);

      return sets.has(key) ? 1 : 0;
    }),
    quit: jest.fn(async () => "OK"),
    sadd: jest.fn(async (key: string, member: string) => {
      const set = getSet(key);
      const had = set.has(member);
      set.add(member);

      return had ? 0 : 1;
    }),
    scard: jest.fn(async (key: string) => sets.get(key)?.size ?? 0),
    srem: jest.fn(async (key: string, member: string) => {
      const set = sets.get(key);

      return set?.delete(member) ? 1 : 0;
    }),
  })),
);

// eslint-disable-next-line import/first -- import must follow jest.mock so ioredis is mocked first
import { PRESENCE_TTL_SECONDS, PresenceService } from "./presence.service";

describe("PresenceService", () => {
  beforeEach(() => {
    sets.clear();
    expireCalls.length = 0;
  });

  it("reports online -> offline transitions across multiple sockets", async () => {
    const service = new PresenceService();

    expect(await service.addConnection("u1", "socket-a")).toBe(true); // first socket -> came online
    expect(await service.addConnection("u1", "socket-b")).toBe(false); // second device
    expect(await service.isOnline("u1")).toBe(true);
    expect(await service.removeConnection("u1", "socket-a")).toBe(false); // still one socket
    expect(await service.removeConnection("u1", "socket-b")).toBe(true); // last socket -> went offline
    expect(await service.isOnline("u1")).toBe(false);
  });

  it("ignores a duplicate socket id without re-announcing online", async () => {
    const service = new PresenceService();

    expect(await service.addConnection("u1", "socket-a")).toBe(true);
    expect(await service.addConnection("u1", "socket-a")).toBe(false); // same socket again
  });

  it("does not report a transition when removing an unknown socket", async () => {
    const service = new PresenceService();

    expect(await service.removeConnection("u1", "ghost")).toBe(false);
  });

  it("stamps the TTL on connect and refresh", async () => {
    const service = new PresenceService();

    await service.addConnection("u1", "socket-a");
    await service.refresh("u1", "socket-a");

    expect(expireCalls).toContainEqual(["presence:u1", PRESENCE_TTL_SECONDS]);
    expect(expireCalls.filter(([key]) => key === "presence:u1")).toHaveLength(2);
  });

  it("closes the Redis connection on module destroy", async () => {
    const service = new PresenceService();
    await expect(service.onModuleDestroy()).resolves.not.toThrow();
  });
});

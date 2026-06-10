const counters = new Map<string, number>();
const ttls = new Map<string, number>();
const pexpireCalls: Array<[string, number]> = [];

jest.mock("ioredis", () =>
  jest.fn().mockImplementation(() => ({
    incr: jest.fn(async (key: string) => {
      const next = (counters.get(key) ?? 0) + 1;
      counters.set(key, next);

      return next;
    }),
    pexpire: jest.fn(async (key: string, ms: number) => {
      pexpireCalls.push([key, ms]);
      ttls.set(key, ms);

      return 1;
    }),
    pttl: jest.fn(async (key: string) => ttls.get(key) ?? -1),
    quit: jest.fn(async () => "OK"),
  })),
);

// eslint-disable-next-line import/first -- import must follow jest.mock so ioredis is mocked first
import { WsRateLimitService } from "./ws-rate-limit.service";

describe("WsRateLimitService", () => {
  beforeEach(() => {
    counters.clear();
    ttls.clear();
    pexpireCalls.length = 0;
  });

  it("allows hits up to the limit and stamps the TTL on the first hit", async () => {
    const service = new WsRateLimitService();

    const first = await service.consume("u1", "typing", 2, 10_000);
    const second = await service.consume("u1", "typing", 2, 10_000);

    expect(first).toEqual({ allowed: true, retryAfterSeconds: 0 });
    expect(second).toEqual({ allowed: true, retryAfterSeconds: 0 });
    expect(pexpireCalls).toEqual([["ratelimit:ws:u1:typing", 10_000]]); // stamped once, on the first hit
  });

  it("denies hits past the limit and reports retry seconds from the remaining TTL", async () => {
    const service = new WsRateLimitService();

    await service.consume("u1", "typing", 2, 10_000);
    await service.consume("u1", "typing", 2, 10_000);
    const blocked = await service.consume("u1", "typing", 2, 10_000);

    expect(blocked).toEqual({ allowed: false, retryAfterSeconds: 10 });
  });

  it("keeps separate buckets per user and per event", async () => {
    const service = new WsRateLimitService();

    await service.consume("u1", "typing", 1, 10_000);
    const otherUser = await service.consume("u2", "typing", 1, 10_000);
    const otherEvent = await service.consume("u1", "message", 1, 10_000);

    expect(otherUser.allowed).toBe(true);
    expect(otherEvent.allowed).toBe(true);
  });

  it("rounds a negative/expired TTL up to zero retry seconds", async () => {
    const service = new WsRateLimitService();

    await service.consume("u1", "typing", 1, 10_000); // first hit stamps a TTL
    ttls.clear(); // simulate the key losing its TTL (pttl now returns -1)
    const blocked = await service.consume("u1", "typing", 1, 10_000);

    expect(blocked).toEqual({ allowed: false, retryAfterSeconds: 0 });
  });

  it("closes the Redis connection on shutdown", async () => {
    const service = new WsRateLimitService();

    await expect(service.onModuleDestroy()).resolves.not.toThrow();
  });
});

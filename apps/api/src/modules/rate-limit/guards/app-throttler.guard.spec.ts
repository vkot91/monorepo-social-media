import type { ExecutionContext } from "@nestjs/common";
import type { Reflector } from "@nestjs/core";
import type { ThrottlerModuleOptions, ThrottlerStorage } from "@nestjs/throttler";

import { AppThrottlerGuard } from "./app-throttler.guard";

type GuardInternals = {
  getTracker: (req: Record<string, unknown>) => Promise<string>;
  generateKey: (context: ExecutionContext, suffix: string, name: string) => string;
};

const createGuard = (): GuardInternals => {
  const guard = new AppThrottlerGuard(
    [] as unknown as ThrottlerModuleOptions,
    {} as ThrottlerStorage,
    {} as Reflector,
  );

  return guard as unknown as GuardInternals;
};

describe("AppThrottlerGuard", () => {
  describe("getTracker", () => {
    it("tracks authenticated requests by user id", async () => {
      const guard = createGuard();

      await expect(guard.getTracker({ ip: "10.0.0.1", user: { sub: "user-1" } })).resolves.toBe("user-1");
    });

    it("falls back to the client IP for anonymous requests", async () => {
      const guard = createGuard();

      await expect(guard.getTracker({ ip: "10.0.0.1" })).resolves.toBe("10.0.0.1");
    });

    it("falls back to a constant when neither user nor IP is available", async () => {
      const guard = createGuard();

      await expect(guard.getTracker({})).resolves.toBe("unknown");
    });
  });

  describe("generateKey", () => {
    it("namespaces keys under ratelimit: with the throttler name and tracker", () => {
      const guard = createGuard();

      expect(guard.generateKey({} as ExecutionContext, "user-1", "default")).toBe("ratelimit:default:user-1");
    });
  });
});

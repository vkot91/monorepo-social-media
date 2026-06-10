import { type ExecutionContext, Injectable } from "@nestjs/common";
import { ThrottlerGuard } from "@nestjs/throttler";

type TrackableRequest = {
  ip?: string;
  user?: { sub?: string };
};

/**
 * Global rate-limit guard. Tracks authenticated callers by their user id (so a bucket
 * follows the user across IPs/devices) and falls back to the client IP for public/anon
 * routes such as login and register. Keys are namespaced under `ratelimit:` so they are
 * easy to inspect with `redis-cli`. On exceed the base guard sets `Retry-After` and the
 * `X-RateLimit-*` headers and throws a 429, which the HttpExceptionFilter formats.
 */
@Injectable()
export class AppThrottlerGuard extends ThrottlerGuard {
  protected getTracker(req: TrackableRequest): Promise<string> {
    return Promise.resolve(req.user?.sub ?? req.ip ?? "unknown");
  }

  protected generateKey(_context: ExecutionContext, suffix: string, name: string): string {
    return `ratelimit:${name}:${suffix}`;
  }
}

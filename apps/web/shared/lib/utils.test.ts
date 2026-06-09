import { afterEach, describe, expect, it, vi } from "vitest";

import { formatRelativeTime } from "./utils";

describe("formatRelativeTime", () => {
  afterEach(() => {
    vi.useRealTimers();
  });

  const freeze = (now: string) => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date(now));
  };

  it("returns 'just now' when less than 60 seconds have passed", () => {
    freeze("2026-06-09T10:00:45.000Z");
    expect(formatRelativeTime("2026-06-09T10:00:00.000Z")).toBe("just now");
  });

  it("returns minutes ago when less than an hour has passed", () => {
    freeze("2026-06-09T10:05:00.000Z");
    expect(formatRelativeTime("2026-06-09T10:00:00.000Z")).toBe("5m ago");
  });

  it("returns hours ago when less than a day has passed", () => {
    freeze("2026-06-09T13:00:00.000Z");
    expect(formatRelativeTime("2026-06-09T10:00:00.000Z")).toBe("3h ago");
  });

  it("returns days ago when less than a week has passed", () => {
    freeze("2026-06-11T10:00:00.000Z");
    expect(formatRelativeTime("2026-06-09T10:00:00.000Z")).toBe("2d ago");
  });

  it("returns an absolute date without the year when within the same year", () => {
    freeze("2026-06-17T10:00:00.000Z");
    expect(formatRelativeTime("2026-06-09T10:00:00.000Z")).toBe("Jun 9");
  });

  it("returns an absolute date with the year when older than a year", () => {
    freeze("2026-06-09T10:00:00.000Z");
    expect(formatRelativeTime("2025-01-01T10:00:00.000Z")).toBe("Jan 1, 2025");
  });
});

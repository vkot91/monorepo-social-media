import { act, renderHook } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { useThrottledCallback } from "./use-throttled-callback";

describe("useThrottledCallback", () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("runs immediately, then ignores calls within the delay window", () => {
    const callback = vi.fn();
    const { result } = renderHook(() => useThrottledCallback(callback, 1000));

    act(() => {
      result.current.run();
      result.current.run();
      result.current.run();
    });

    expect(callback).toHaveBeenCalledTimes(1);
  });

  it("runs again once the delay has elapsed", () => {
    const callback = vi.fn();
    const { result } = renderHook(() => useThrottledCallback(callback, 1000));

    act(() => result.current.run());
    act(() => vi.advanceTimersByTime(1000));
    act(() => result.current.run());

    expect(callback).toHaveBeenCalledTimes(2);
  });

  it("fires immediately again after reset", () => {
    const callback = vi.fn();
    const { result } = renderHook(() => useThrottledCallback(callback, 1000));

    act(() => result.current.run());
    act(() => result.current.reset());
    act(() => result.current.run());

    expect(callback).toHaveBeenCalledTimes(2);
  });

  it("forwards arguments to the callback", () => {
    const callback = vi.fn();
    const { result } = renderHook(() => useThrottledCallback(callback, 1000));

    act(() => result.current.run("hello", 42));

    expect(callback).toHaveBeenCalledWith("hello", 42);
  });
});

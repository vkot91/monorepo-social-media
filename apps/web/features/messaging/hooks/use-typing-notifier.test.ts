import { act, renderHook } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { getRealtimeSocket } from "#/shared/lib/realtime/socket";

import { useTypingNotifier } from "./use-typing-notifier";

vi.mock("#/shared/lib/realtime/socket", () => ({ getRealtimeSocket: vi.fn() }));

const createFakeSocket = () => ({ emit: vi.fn(), off: vi.fn(), on: vi.fn() });

describe("useTypingNotifier", () => {
  let socket: ReturnType<typeof createFakeSocket>;

  beforeEach(() => {
    vi.useFakeTimers();
    socket = createFakeSocket();
    vi.mocked(getRealtimeSocket).mockReturnValue(socket as never);
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  const typingTrueCalls = () =>
    socket.emit.mock.calls.filter(([event, payload]) => event === "typing" && (payload as { isTyping: boolean }).isTyping);

  it("emits a single throttled keepalive across a burst of keystrokes", () => {
    const { result } = renderHook(() => useTypingNotifier("conv-1"));

    act(() => {
      result.current.notifyTyping();
      result.current.notifyTyping();
      result.current.notifyTyping();
    });

    expect(typingTrueCalls()).toHaveLength(1);
    expect(socket.emit).toHaveBeenCalledWith("typing", { conversationId: "conv-1", isTyping: true });
  });

  it("emits a stop event after the idle delay", () => {
    const { result } = renderHook(() => useTypingNotifier("conv-1"));

    act(() => result.current.notifyTyping());
    act(() => vi.advanceTimersByTime(2000));

    expect(socket.emit).toHaveBeenCalledWith("typing", { conversationId: "conv-1", isTyping: false });
  });

  it("flushes a stop event immediately when stopTyping is called", () => {
    const { result } = renderHook(() => useTypingNotifier("conv-1"));

    act(() => result.current.notifyTyping());
    act(() => result.current.stopTyping());

    expect(socket.emit).toHaveBeenLastCalledWith("typing", { conversationId: "conv-1", isTyping: false });
  });
});

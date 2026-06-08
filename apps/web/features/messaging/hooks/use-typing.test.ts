import { act, renderHook } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { getRealtimeSocket } from "#/shared/lib/realtime/socket";

import { useTyping } from "./use-typing";

vi.mock("#/shared/lib/realtime/socket", () => ({
  getRealtimeSocket: vi.fn(),
}));

type Handler = (payload: unknown) => void;

const createFakeSocket = () => {
  const handlers = new Map<string, Handler>();

  return {
    emit: vi.fn(),
    handlers,
    off: vi.fn((event: string) => handlers.delete(event)),
    on: vi.fn((event: string, cb: Handler) => handlers.set(event, cb)),
  };
};

describe("useTyping", () => {
  let socket: ReturnType<typeof createFakeSocket>;

  beforeEach(() => {
    socket = createFakeSocket();
    vi.mocked(getRealtimeSocket).mockReturnValue(socket as never);
  });

  it("tracks the counterpart typing state for the active conversation", () => {
    const { result } = renderHook(() => useTyping("conv-1"));

    expect(result.current.isCounterpartTyping).toBe(false);

    act(() => socket.handlers.get("typing")?.({ conversationId: "conv-1", isTyping: true }));
    expect(result.current.isCounterpartTyping).toBe(true);
  });

  it("ignores typing events from other conversations", () => {
    const { result } = renderHook(() => useTyping("conv-1"));

    act(() => socket.handlers.get("typing")?.({ conversationId: "conv-2", isTyping: true }));

    expect(result.current.isCounterpartTyping).toBe(false);
  });

  it("emits typing events for the conversation", () => {
    const { result } = renderHook(() => useTyping("conv-1"));

    act(() => result.current.emitTyping(true));

    expect(socket.emit).toHaveBeenCalledWith("typing", { conversationId: "conv-1", isTyping: true });
  });

  it("unsubscribes on unmount", () => {
    const { unmount } = renderHook(() => useTyping("conv-1"));

    unmount();

    expect(socket.off).toHaveBeenCalledWith("typing", expect.any(Function));
  });
});

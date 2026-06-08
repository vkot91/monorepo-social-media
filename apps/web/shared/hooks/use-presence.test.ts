import { act, renderHook } from "@testing-library/react";
import { beforeEach, describe, expect, it } from "vitest";

import { usePresenceStore } from "#/shared/lib/realtime/presence-store";

import { usePresence } from "./use-presence";

describe("usePresence", () => {
  beforeEach(() => {
    usePresenceStore.setState({ onlineUserIds: new Set<string>() });
  });

  it("returns the current set of online user IDs from the store", () => {
    act(() => usePresenceStore.getState().setOnline("user-2"));

    const { result } = renderHook(() => usePresence());

    expect(result.current.has("user-2")).toBe(true);
  });

  it("reactively updates when the store changes", () => {
    const { result } = renderHook(() => usePresence());

    expect(result.current.has("user-2")).toBe(false);

    act(() => usePresenceStore.getState().setOnline("user-2"));
    expect(result.current.has("user-2")).toBe(true);

    act(() => usePresenceStore.getState().setOffline("user-2"));
    expect(result.current.has("user-2")).toBe(false);
  });
});

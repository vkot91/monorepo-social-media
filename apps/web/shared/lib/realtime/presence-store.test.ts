import { beforeEach, describe, expect, it } from "vitest";

import { usePresenceStore } from "./presence-store";

const reset = () => usePresenceStore.setState({ onlineUserIds: new Set<string>() });

describe("usePresenceStore", () => {
  beforeEach(reset);

  it("adds a user that comes online", () => {
    usePresenceStore.getState().setOnline("user-1");

    expect(usePresenceStore.getState().onlineUserIds.has("user-1")).toBe(true);
  });

  it("removes a user that goes offline", () => {
    usePresenceStore.getState().setOnline("user-1");
    usePresenceStore.getState().setOffline("user-1");

    expect(usePresenceStore.getState().onlineUserIds.has("user-1")).toBe(false);
  });

  it("does not duplicate an already-online user", () => {
    usePresenceStore.getState().setOnline("user-1");
    const first = usePresenceStore.getState().onlineUserIds;

    usePresenceStore.getState().setOnline("user-1");
    const second = usePresenceStore.getState().onlineUserIds;

    expect(second).toBe(first); // identity unchanged -> no re-render churn
    expect(second.size).toBe(1);
  });

  it("ignores setOffline for a user that is not online", () => {
    const before = usePresenceStore.getState().onlineUserIds;

    usePresenceStore.getState().setOffline("ghost");

    expect(usePresenceStore.getState().onlineUserIds).toBe(before);
  });
});

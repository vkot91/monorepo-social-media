"use client";

import { usePresenceStore } from "#/shared/lib/realtime/presence-store";

/** Reads the set of currently-online user IDs from the shared presence store. */
export const usePresence = (): Set<string> => usePresenceStore((state) => state.onlineUserIds);

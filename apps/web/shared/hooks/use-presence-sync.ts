"use client";

import type { PresenceEvent } from "@social/contracts";
import { useEffect } from "react";

import { useUser } from "#/features/auth/api/queries";
import { usePresenceStore } from "#/shared/lib/realtime/presence-store";
import { getRealtimeSocket } from "#/shared/lib/realtime/socket";

// Subscribes to presence events on the realtime socket and mirrors them into the shared
// presence store, so any feature can read online status via usePresence.
export const usePresenceSync = (): void => {
  const { data: user } = useUser();
  const viewerId = user?.id;

  useEffect(() => {
    if (!viewerId) {
      return;
    }

    const socket = getRealtimeSocket();
    const { setOffline, setOnline } = usePresenceStore.getState();

    const onPresence = (payload: PresenceEvent) => {
      if (payload.online) {
        setOnline(payload.userId);
      } else {
        setOffline(payload.userId);
      }
    };

    socket.on("presence", onPresence);

    return () => {
      socket.off("presence", onPresence);
      // Drop stale presence so a different session never starts with another user's friends.
      usePresenceStore.setState({ onlineUserIds: new Set<string>() });
    };
  }, [viewerId]);
};

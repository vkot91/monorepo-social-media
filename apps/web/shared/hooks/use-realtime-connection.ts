"use client";

import { useEffect } from "react";

import { useUser } from "#/features/auth/api/queries";
import { disconnectRealtimeSocket, getRealtimeSocket } from "#/shared/lib/realtime/socket";

// Owns the lifecycle of the single app-wide realtime socket: it connects once a viewer is
// authenticated and tears the connection down on unmount or sign-out.
export const useRealtimeConnection = (): void => {
  const { data: user } = useUser();
  const viewerId = user?.id;

  useEffect(() => {
    if (!viewerId) {
      return;
    }

    getRealtimeSocket().connect();

    return () => {
      disconnectRealtimeSocket();
    };
  }, [viewerId]);
};

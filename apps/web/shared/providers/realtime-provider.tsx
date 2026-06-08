"use client";

import { type ReactNode } from "react";

import { usePresenceSync } from "#/shared/hooks/use-presence-sync";
import { useRealtimeConnection } from "#/shared/hooks/use-realtime-connection";

type RealtimeProviderProps = { children: ReactNode };

// Mounts the app-wide realtime socket for the authenticated shell: it subscribes to presence
// updates and then opens the connection, keeping the shared presence store in sync.
export const RealtimeProvider = ({ children }: RealtimeProviderProps) => {
  useRealtimeConnection();
  usePresenceSync();

  return <>{children}</>;
};

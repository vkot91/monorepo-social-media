"use client";

import { io, type Socket } from "socket.io-client";

import { getWebEnv } from "#/env";
import { bffClient } from "#/shared/lib/api/api-client/bff-client";

let socket: Socket | null = null;

const fetchToken = async (): Promise<string> => {
  const { token } = await bffClient("/api/realtime/token", "GET", {});

  return token;
};

export const getRealtimeSocket = (): Socket => {
  if (socket) {
    return socket;
  }

  socket = io(getWebEnv().NEXT_PUBLIC_API_URL, {
    // The auth callback re-runs on every (re)connect, so an expired token is
    // automatically re-fetched from the BFF before each handshake.
    auth: (cb: (data: { token: string }) => void) => {
      void fetchToken().then((token) => cb({ token }));
    },
    autoConnect: false,
    transports: ["websocket"],
  });

  return socket;
};

export const disconnectRealtimeSocket = (): void => {
  socket?.disconnect();
  socket = null;
};

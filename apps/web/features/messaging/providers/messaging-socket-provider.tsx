"use client";

import type { ReactNode } from "react";

import { useMessagingSocket } from "../hooks/use-messaging-socket";

type MessagingSocketProviderProps = { children: ReactNode };

export const MessagingSocketProvider = ({ children }: MessagingSocketProviderProps) => {
  useMessagingSocket();

  return <>{children}</>;
};

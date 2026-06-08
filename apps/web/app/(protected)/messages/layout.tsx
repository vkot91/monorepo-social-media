import type { ReactNode } from "react";

import { MessagesShell } from "#/features/messaging/components/messages-shell";

export default function MessagesLayout({ children }: { children: ReactNode }) {
  return <MessagesShell>{children}</MessagesShell>;
}

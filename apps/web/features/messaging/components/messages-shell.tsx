"use client";

import { useQuery } from "@tanstack/react-query";
import { LoaderCircle } from "lucide-react";
import { useParams } from "next/navigation";
import type { ReactNode } from "react";

import { usePresence } from "#/shared/hooks/use-presence";
import { cn } from "#/shared/lib/utils";
import { Card } from "#/shared/ui";

import { conversationsQueryOptions } from "../api/queries";
import { ConversationList } from "./conversation-list";

type MessagesShellProps = {
  children: ReactNode;
};

export const MessagesShell = ({ children }: MessagesShellProps) => {
  const params = useParams<{ id?: string }>();
  const activeId = params.id ?? null;
  const onlineUserIds = usePresence();
  const { data: conversations = [], isLoading } = useQuery(conversationsQueryOptions());

  return (
    <section aria-label="Messages" className="md:grid md:grid-cols-[320px_1fr] md:gap-4">
      <Card
        className={cn(
          "h-[calc(100dvh-9rem)] overflow-y-auto overflow-x-hidden p-2",
          activeId ? "hidden md:block" : "block",
        )}
      >
        {isLoading ? (
          <div className="flex flex-1 items-center justify-center" role="status">
            <LoaderCircle aria-hidden className="h-5 w-5 animate-spin text-muted-text" />
          </div>
        ) : (
          <ConversationList activeId={activeId} conversations={conversations} onlineUserIds={onlineUserIds} />
        )}
      </Card>
      <Card className={cn("h-[calc(100dvh-9rem)] p-4", activeId ? "block" : "hidden md:block")}>{children}</Card>
    </section>
  );
};

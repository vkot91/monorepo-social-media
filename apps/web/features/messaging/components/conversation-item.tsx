"use client";

import type { ConversationDto } from "@social/contracts";
import Link from "next/link";

import { cn } from "#/shared/lib/utils";

type ConversationItemProps = {
  conversation: ConversationDto;
  isActive: boolean;
  isOnline: boolean;
};

export const ConversationItem = ({ conversation, isActive, isOnline }: ConversationItemProps) => {
  const { lastMessage, participant, unreadCount } = conversation;
  const preview = lastMessage && !lastMessage.deletedAt ? lastMessage.content : "No messages yet";

  return (
    <Link
      aria-current={isActive ? "page" : undefined}
      className={cn(
        "flex w-full items-center gap-3 overflow-hidden rounded-lg border-l-4 px-3 py-2.5 text-left no-underline transition-colors",
        isActive ? "border-primary bg-primary/10" : "border-transparent hover:bg-subtle-surface",
      )}
      href={{ pathname: `/messages/${conversation.id}` }}
    >
      <span className="relative shrink-0">
        <span className="block h-11 w-11 rounded-full bg-warning" />
        {isOnline ? (
          <span
            aria-hidden
            className="absolute bottom-0 right-0 h-3 w-3 rounded-full border-2 border-background bg-success"
          />
        ) : null}
      </span>
      <span className="min-w-0 flex-1">
        <span className="flex items-center justify-between gap-2">
          <strong className={cn("min-w-0 truncate", isActive ? "text-primary" : "text-text")}>
            {participant.displayName}
          </strong>
          {unreadCount > 0 ? (
            <span className="shrink-0 rounded-full bg-danger px-2 text-xs font-bold text-on-danger">
              {unreadCount > 9 ? "9+" : unreadCount}
            </span>
          ) : null}
        </span>
        <span className={cn("mt-0.5 block truncate text-sm", unreadCount > 0 ? "text-text" : "text-muted-text")}>
          {preview}
        </span>
      </span>
    </Link>
  );
};

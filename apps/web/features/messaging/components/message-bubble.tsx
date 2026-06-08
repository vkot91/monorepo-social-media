"use client";

import type { MessageDto } from "@social/contracts";
import { Check, CheckCheck, Ellipsis, Trash2 } from "lucide-react";

import { cn } from "#/shared/lib/utils";
import { DropdownMenu } from "#/shared/ui";

type MessageBubbleProps = {
  isOwn: boolean;
  isSeen: boolean;
  message: MessageDto;
  onDelete: (id: string) => void;
};

const formatTime = (iso: string) => new Date(iso).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });

export const MessageBubble = ({ isOwn, isSeen, message, onDelete }: MessageBubbleProps) => {
  const isDeleted = Boolean(message.deletedAt);

  return (
    <div className={cn("flex w-full", isOwn ? "justify-end" : "justify-start")}>
      <div className={cn("flex max-w-[80%] flex-col gap-1 sm:max-w-[70%]", isOwn ? "items-end" : "items-start")}>
        <div className={cn("flex items-center gap-1", isOwn ? "flex-row-reverse" : "flex-row")}>
          <div
            className={cn(
              "w-fit whitespace-pre-wrap wrap-break-word rounded-2xl px-3.5 py-2 text-sm leading-snug shadow-sm",
              isDeleted
                ? "border border-line italic text-muted-text"
                : isOwn
                  ? "rounded-br-md bg-primary text-on-primary"
                  : "rounded-bl-md border border-line bg-surface text-text",
            )}
          >
            {isDeleted ? "Message deleted" : message.content}
          </div>
          {isOwn && !isDeleted ? (
            <DropdownMenu
              items={[
                {
                  icon: Trash2,
                  label: "Delete",
                  onSelect: () => onDelete(message.id),
                  variant: "danger",
                },
              ]}
              label="Open message actions"
              side="top"
              trigger={<Ellipsis aria-hidden className="h-4 w-4" />}
              triggerClassName="h-7 w-7 border-0 p-0"
            />
          ) : null}
        </div>
        <div
          className={cn(
            "flex items-center gap-1 px-1 text-[11px] text-muted-text",
            isOwn ? "flex-row-reverse" : "flex-row",
          )}
        >
          <time dateTime={message.createdAt}>{formatTime(message.createdAt)}</time>
          {isOwn && !isDeleted ? (
            isSeen ? (
              <CheckCheck aria-label="Seen" className="h-3.5 w-3.5 text-primary" role="img" />
            ) : (
              <Check aria-label="Delivered" className="h-3.5 w-3.5" role="img" />
            )
          ) : null}
        </div>
      </div>
    </div>
  );
};

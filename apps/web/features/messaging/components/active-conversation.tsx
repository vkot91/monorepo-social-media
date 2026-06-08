"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import { useEffect } from "react";

import { clearConversationUnread } from "../api/helpers/cache";
import { markConversationRead } from "../api/mutations";
import { conversationsQueryOptions } from "../api/queries";
import { messagingKeys } from "../api/routes";
import { useTyping } from "../hooks/use-typing";
import { MessageComposer } from "./message-composer";
import { MessageThread } from "./message-thread";
import { TypingIndicator } from "./typing-indicator";

type ActiveConversationProps = {
  conversationId: string;
};

export const ActiveConversation = ({ conversationId }: ActiveConversationProps) => {
  const queryClient = useQueryClient();
  const { isCounterpartTyping } = useTyping(conversationId);

  const { data: conversations } = useQuery(conversationsQueryOptions());
  const conversation = conversations?.find((item) => item.id === conversationId);
  const title = conversation?.participant.displayName ?? "Conversation";
  const unreadCount = conversation?.unreadCount ?? 0;

  const { mutate: markRead } = useMutation({
    mutationFn: markConversationRead,
    onSuccess: (_data, id) => {
      queryClient.setQueryData(messagingKeys.conversations, (data: unknown) =>
        clearConversationUnread(data as never, id),
      );
    },
  });

  // Mark read whenever there are unread messages — covers opening the thread and live
  // arrivals (a new message bumps unreadCount, which re-runs this effect).
  useEffect(() => {
    if (unreadCount > 0) {
      markRead(conversationId);
    }
  }, [conversationId, markRead, unreadCount]);

  return (
    <div className="flex h-full flex-col">
      <header className="flex items-center gap-3 border-b border-line pb-3">
        <Link
          aria-label="Back to conversations"
          className="rounded-lg p-1 text-muted-text no-underline hover:bg-subtle-surface md:hidden"
          href={{ pathname: "/messages" }}
        >
          <ArrowLeft aria-hidden className="h-5 w-5" />
        </Link>
        <h2 className="m-0 truncate text-base font-bold">{title}</h2>
      </header>
      <MessageThread conversationId={conversationId} initialCounterpartReadAt={conversation?.counterpartReadAt ?? null} />
      <TypingIndicator isTyping={isCounterpartTyping} />
      <div className="border-t border-line pt-3">
        <MessageComposer conversationId={conversationId} />
      </div>
    </div>
  );
};

"use client";

import type { MessageDto, MessageReadEvent } from "@social/contracts";
import { useInfiniteQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { LoaderCircle } from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";

import { useUser } from "#/features/auth/api/queries";
import { getRealtimeSocket } from "#/shared/lib/realtime/socket";

import { type MessagesInfiniteData,replaceMessageInInfiniteData } from "../api/helpers/cache";
import { deleteMessage } from "../api/mutations";
import { messagesInfiniteQueryOptions } from "../api/queries";
import { messagingKeys } from "../api/routes";
import { MessageBubble } from "./message-bubble";

type MessageThreadProps = {
  conversationId: string;
  initialCounterpartReadAt: string | null;
};

export const MessageThread = ({ conversationId, initialCounterpartReadAt }: MessageThreadProps) => {
  const queryClient = useQueryClient();
  const { data: user } = useUser();
  const viewerId = user?.id;
  const loadMoreRef = useRef<HTMLDivElement>(null);
  const [counterpartReadAt, setCounterpartReadAt] = useState<string | null>(initialCounterpartReadAt);

  // Read receipts only ever move forward in time.
  const advanceReadAt = (next: string) =>
    setCounterpartReadAt((current) => (!current || next > current ? next : current));

  // The seed arrives with the conversation list, which may resolve after this mounts.
  useEffect(() => {
    if (initialCounterpartReadAt) {
      advanceReadAt(initialCounterpartReadAt);
    }
  }, [initialCounterpartReadAt]);

  const { data, fetchNextPage, hasNextPage, isFetching, isFetchingNextPage, isLoading } = useInfiniteQuery(
    messagesInfiniteQueryOptions(conversationId),
  );

  const messages = useMemo(() => data?.pages.flatMap((page) => page.items) ?? [], [data]);

  const deleteMessageMutation = useMutation({
    mutationFn: deleteMessage,
    onMutate: (messageId: string) => {
      const target = messages.find((message) => message.id === messageId);

      if (target) {
        queryClient.setQueryData<MessagesInfiniteData>(messagingKeys.messages(conversationId), (current) =>
          replaceMessageInInfiniteData(current, {
            ...target,
            content: "",
            deletedAt: new Date().toISOString(),
          }),
        );
      }
    },
    onSuccess: (deleted: MessageDto) => {
      queryClient.setQueryData<MessagesInfiniteData>(messagingKeys.messages(conversationId), (current) =>
        replaceMessageInInfiniteData(current, deleted),
      );
    },
  });

  useEffect(() => {
    const socket = getRealtimeSocket();

    const onRead = (event: MessageReadEvent) => {
      if (event.conversationId === conversationId && event.userId !== viewerId) {
        advanceReadAt(event.readAt);
      }
    };

    socket.on("message:read", onRead);

    return () => {
      socket.off("message:read", onRead);
    };
  }, [conversationId, viewerId]);

  useEffect(() => {
    if (!hasNextPage || isFetching || typeof IntersectionObserver === "undefined") {
      return;
    }

    const target = loadMoreRef.current;

    if (!target) {
      return;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries.some((entry) => entry.isIntersecting)) {
          observer.disconnect();
          void fetchNextPage();
        }
      },
      { rootMargin: "200px" },
    );

    observer.observe(target);

    return () => {
      observer.disconnect();
    };
  }, [fetchNextPage, hasNextPage, isFetching]);

  if (isLoading) {
    return (
      <div className="flex flex-1 items-center justify-center" role="status">
        <LoaderCircle aria-hidden className="h-5 w-5 animate-spin text-muted-text" />
      </div>
    );
  }

  if (messages.length === 0) {
    return (
      <div className="flex flex-1 items-center justify-center">
        <p className="text-sm text-muted-text">No messages yet — say hello</p>
      </div>
    );
  }

  return (
    <div
      aria-label="Conversation messages"
      className="flex flex-1 flex-col-reverse gap-2 overflow-y-auto px-1 py-3"
      role="log"
    >
      {messages.map((message) => {
        const isOwn = message.senderId === viewerId;
        const isSeen = isOwn && counterpartReadAt !== null && message.createdAt <= counterpartReadAt;

        return (
          <MessageBubble
            isOwn={isOwn}
            isSeen={isSeen}
            key={message.id}
            message={message}
            onDelete={deleteMessageMutation.mutate}
          />
        );
      })}
      {hasNextPage ? (
        <div aria-hidden className="h-px" ref={loadMoreRef} />
      ) : null}
      {isFetchingNextPage ? (
        <p className="flex items-center justify-center gap-2 text-sm text-muted-text" role="status">
          <LoaderCircle aria-hidden className="h-4 w-4 animate-spin" /> Loading earlier messages…
        </p>
      ) : null}
    </div>
  );
};

"use client";

import type { MessageDto } from "@social/contracts";
import { useQueryClient } from "@tanstack/react-query";
import { useEffect } from "react";

import { useUser } from "#/features/auth/api/queries";
import { getRealtimeSocket } from "#/shared/lib/realtime/socket";

import {
  addMessageToInfiniteData,
  bumpConversation,
  type MessagesInfiniteData,
  replaceMessageInInfiniteData,
} from "../api/helpers/cache";
import { messagingKeys } from "../api/routes";

export const useMessagingSocket = () => {
  const queryClient = useQueryClient();
  const { data: user } = useUser();
  const viewerId = user?.id;

  useEffect(() => {
    if (!viewerId) {
      return;
    }

    const socket = getRealtimeSocket();

    const onNew = (message: MessageDto) => {
      queryClient.setQueryData<MessagesInfiniteData>(messagingKeys.messages(message.conversationId), (data) =>
        addMessageToInfiniteData(data, message),
      );
      queryClient.setQueryData(messagingKeys.conversations, (data: unknown) =>
        bumpConversation(data as never, message, viewerId),
      );
    };

    const onDeleted = (message: MessageDto) => {
      queryClient.setQueryData<MessagesInfiniteData>(messagingKeys.messages(message.conversationId), (data) =>
        replaceMessageInInfiniteData(data, message),
      );
    };

    socket.on("message:new", onNew);
    socket.on("message:deleted", onDeleted);

    return () => {
      socket.off("message:new", onNew);
      socket.off("message:deleted", onDeleted);
    };
  }, [queryClient, viewerId]);
};

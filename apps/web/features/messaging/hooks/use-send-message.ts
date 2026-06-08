"use client";

import type { MessageDto, SendMessageInput } from "@social/contracts";
import { useMutation, useQueryClient } from "@tanstack/react-query";

import { useUser } from "#/features/auth/api/queries";

import { addMessageToInfiniteData, bumpConversation, type MessagesInfiniteData } from "../api/helpers/cache";
import { sendMessage } from "../api/mutations";
import { messagingKeys, messagingMutationKeys } from "../api/routes";

export const useSendMessage = (conversationId: string) => {
  const queryClient = useQueryClient();
  const { data: user } = useUser();
  const viewerId = user?.id;

  return useMutation<MessageDto, Error, SendMessageInput>({
    mutationFn: (input) => sendMessage({ conversationId, input }),
    mutationKey: messagingMutationKeys.send,
    onSuccess: (created) => {
      queryClient.setQueryData<MessagesInfiniteData>(messagingKeys.messages(conversationId), (data) =>
        addMessageToInfiniteData(data, created),
      );

      if (viewerId) {
        queryClient.setQueryData(messagingKeys.conversations, (data: unknown) =>
          bumpConversation(data as never, created, viewerId),
        );
      }
    },
  });
};

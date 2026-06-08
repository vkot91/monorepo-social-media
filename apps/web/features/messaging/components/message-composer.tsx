"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { type SendMessageInput, sendMessageSchema } from "@social/contracts";
import { SendHorizontal } from "lucide-react";
import { useForm } from "react-hook-form";

import { ApiRequestError } from "#/shared/lib/api/utils/errors";
import { Button } from "#/shared/ui/button";
import { FieldError, TextArea } from "#/shared/ui/form";

import { useSendMessage } from "../hooks/use-send-message";
import { useTypingNotifier } from "../hooks/use-typing-notifier";

type MessageComposerProps = {
  conversationId: string;
};

export const MessageComposer = ({ conversationId }: MessageComposerProps) => {
  const { notifyTyping, stopTyping } = useTypingNotifier(conversationId);
  const sendMessageMutation = useSendMessage(conversationId);

  const {
    formState: { errors },
    handleSubmit,
    register,
    reset,
    setError,
  } = useForm<SendMessageInput>({
    defaultValues: { content: "" },
    mode: "onTouched",
    resolver: zodResolver(sendMessageSchema),
  });

  const contentField = register("content");
  const contentError = errors.content?.message;
  const formError =
    sendMessageMutation.error instanceof ApiRequestError ? sendMessageMutation.error.message : undefined;

  const onSubmit = (values: SendMessageInput) => {
    stopTyping();
    sendMessageMutation.mutate(values, {
      onError: (error) => {
        const message = error instanceof ApiRequestError ? error.errors.content?.[0] : undefined;

        if (message) {
          setError("content", { message });
        }
      },
      onSuccess: () => reset({ content: "" }),
    });
  };

  return (
    <form className="grid gap-2" onSubmit={handleSubmit(onSubmit)}>
      <div className="flex items-end gap-2">
        <TextArea
          aria-label="Write a message"
          className="flex-1"
          maxRows={6}
          minRows={1}
          onChange={(event) => {
            void contentField.onChange(event);
            notifyTyping();
          }}
          onKeyDown={(event) => {
            if (event.key === "Enter" && !event.shiftKey) {
              event.preventDefault();
              void handleSubmit(onSubmit)();
            }
          }}
          placeholder="Write a message…"
          ref={contentField.ref}
          name={contentField.name}
          onBlur={contentField.onBlur}
        />
        <Button aria-label="Send message" loading={sendMessageMutation.isPending} type="submit">
          <SendHorizontal aria-hidden className="h-4 w-4" />
        </Button>
      </div>
      <FieldError message={contentError ?? formError} />
    </form>
  );
};

"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { type CreatePostInput, createPostSchema } from "@social/contracts";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useForm } from "react-hook-form";

import { ApiRequestError } from "#/shared/lib/api/utils/errors";
import { Button } from "#/shared/ui/button";
import { FieldError, FormCard, TextArea } from "#/shared/ui/form";

import { createPost } from "../api/mutations";
import { postsKeys } from "../api/routes";

export const CreatePostForm = () => {
  const queryClient = useQueryClient();

  const {
    formState: { errors, isSubmitting },
    handleSubmit,
    register,
    reset,
    setError,
  } = useForm<CreatePostInput>({
    defaultValues: {
      content: "",
      imageUrl: null,
      visibility: "PUBLIC",
    },
    mode: "onTouched",
    resolver: zodResolver(createPostSchema),
  });

  const createPostMutation = useMutation({
    mutationFn: createPost,
    onError: (error) => {
      if (error instanceof ApiRequestError) {
        const message = error.errors.content?.[0];

        if (message) {
          setError("content", {
            message,
          });
        }
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: postsKeys.infiniteFeedRoot });

      reset({
        content: "",
        imageUrl: null,
        visibility: "PUBLIC",
      });
    },
  });

  const contentError = errors.content?.message;
  const formError = createPostMutation.error instanceof ApiRequestError ? createPostMutation.error.message : undefined;

  const onSubmit = (values: CreatePostInput) => {
    createPostMutation.mutate(values);
  };

  return (
    <FormCard className="max-w-full" onSubmit={handleSubmit(onSubmit)}>
      <TextArea
        invalid={!!contentError}
        minRows={2}
        aria-label="Create post"
        placeholder="What are you building today?"
        variant="borderless"
        radius="2xl"
        {...register("content")}
      />
      <FieldError message={contentError} />
      <FieldError message={formError} />
      <div className="text-right">
        <Button loading={isSubmitting || createPostMutation.isPending} type="submit">
          Post
        </Button>
      </div>
    </FormCard>
  );
};

"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { type CreatePostInput, createPostSchema, type PostDto } from "@social/contracts";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { useForm } from "react-hook-form";

import { ApiRequestError } from "#/shared/lib/api/utils/errors";
import { Button } from "#/shared/ui/button";
import { FieldError, FormCard, TextArea } from "#/shared/ui/form";

import { createPost } from "../api/mutations";
import { postMutationKeys, postsKeys } from "../api/routes";

const createPostDefaultValues: CreatePostInput = {
  content: "",
  imageUrl: null,
  visibility: "PUBLIC",
};

export const CreatePostForm = () => {
  const [isCreateRequestPending, setIsCreateRequestPending] = useState(false);
  const queryClient = useQueryClient();

  const {
    formState: { errors },
    handleSubmit,
    register,
    reset,
    setError,
  } = useForm<CreatePostInput>({
    defaultValues: createPostDefaultValues,
    mode: "onTouched",
    resolver: zodResolver(createPostSchema),
  });

  const createPostMutation = useMutation<PostDto, Error, CreatePostInput>({
    mutationKey: postMutationKeys.create,
    mutationFn: createPost,
    onMutate: () => {
      setIsCreateRequestPending(true);
    },
    onError: (error, values) => {
      setIsCreateRequestPending(false);
      reset(values);

      if (error instanceof ApiRequestError) {
        const message = error.errors.content?.[0];

        if (message) {
          setError("content", {
            message,
          });
        }
      }
    },
    onSuccess() {
      setIsCreateRequestPending(false);
      reset(createPostDefaultValues);
    },
    onSettled() {
      return queryClient.invalidateQueries({ queryKey: postsKeys.infiniteFeedRoot });
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
        <Button loading={isCreateRequestPending} type="submit">
          Post
        </Button>
      </div>
    </FormCard>
  );
};

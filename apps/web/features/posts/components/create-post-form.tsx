"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { type CreatePostInput, createPostSchema, type PostDto } from "@social/contracts";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useForm } from "react-hook-form";

import { Button } from "#/components/ui/button";
import { FieldError, FormCard, TextArea } from "#/components/ui/form";
import { ApiRequestError } from "#/lib/api/utils/errors";

import { createPost } from "../lib/mutations";
import { postsKeys } from "../lib/routes";

export const CreatePostForm = () => {
  const queryClient = useQueryClient();
  const createPostMutation = useMutation({
    mutationFn: createPost,
    onSuccess: (post) => {
      const feedQuery = {
        feed: "all" as const,
      };

      queryClient.setQueryData<PostDto[]>(postsKeys.feed(feedQuery), (posts = []) => [post, ...posts]);
      void queryClient.invalidateQueries({ queryKey: postsKeys.all });
    },
  });
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

  const contentError = errors.content?.message;
  const formError = createPostMutation.error instanceof ApiRequestError ? createPostMutation.error.message : undefined;
  
  const onSubmit = async (values: CreatePostInput) => {
    try {
      await createPostMutation.mutateAsync(values);

      reset({
        content: "",
        imageUrl: null,
        visibility: "PUBLIC",
      });
    } catch (error) {
      if (error instanceof ApiRequestError) {
        const message = error.errors.content?.[0];

        if (message) {
          setError("content", {
            message,
          });
        }
      }
    }
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
        <Button size="sm" loading={isSubmitting || createPostMutation.isPending} type="submit">
          Post
        </Button>
      </div>
    </FormCard>
  );
};

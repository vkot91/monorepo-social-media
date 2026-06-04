"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { type CreatePostInput, createPostSchema, type PostDto } from "@social/contracts";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { useForm } from "react-hook-form";

import { ApiRequestError } from "#/shared/lib/api/utils/errors";
import { Button } from "#/shared/ui/button";
import { FieldError, FormCard, TextArea } from "#/shared/ui/form";

import { addPostToInfiniteData, type PostsInfiniteData } from "../api/helpers/cache";
import { createPost, type CreatePostMutationInput } from "../api/mutations";
import { postMutationKeys, postsKeys } from "../api/routes";
import { type ManagedPostImage, PostImageManager } from "./post-images";

const createPostDefaultValues: CreatePostInput = {
  content: "",
  visibility: "PUBLIC",
};

export const CreatePostForm = () => {
  const [images, setImages] = useState<ManagedPostImage[]>([]);
  const [isCreateRequestPending, setIsCreateRequestPending] = useState(false);
  const queryClient = useQueryClient();

  const {
    formState: { errors, isDirty },
    handleSubmit,
    register,
    reset,
    setError,
  } = useForm<CreatePostInput>({
    defaultValues: createPostDefaultValues,
    mode: "onTouched",
    resolver: zodResolver(createPostSchema),
  });

  const createPostMutation = useMutation<PostDto, Error, CreatePostMutationInput>({
    mutationKey: postMutationKeys.create,
    mutationFn: createPost,
    onMutate: () => {
      setIsCreateRequestPending(true);
    },
    onError: (error, values) => {
      setIsCreateRequestPending(false);
      reset({
        content: values.content,
        visibility: values.visibility,
      });

      if (error instanceof ApiRequestError) {
        const message = error.errors.content?.[0];

        if (message) {
          setError("content", {
            message,
          });
        }
      }
    },
    onSuccess(createdPost) {
      setIsCreateRequestPending(false);
      queryClient.setQueriesData<PostsInfiniteData>({ queryKey: postsKeys.infiniteFeedRoot }, (data) =>
        addPostToInfiniteData(data, createdPost),
      );
      reset(createPostDefaultValues);
      setImages([]);
    },
    onSettled(_createdPost, error) {
      void queryClient.invalidateQueries({
        queryKey: postsKeys.infiniteFeedRoot,
        refetchType: error ? "none" : "active",
      });
    },
  });

  const contentError = errors.content?.message;
  const formError = createPostMutation.error instanceof ApiRequestError ? createPostMutation.error.message : undefined;
  const hasImages = images.length > 0;

  const onSubmit = (values: CreatePostInput) => {
    createPostMutation.mutate({
      ...values,
      images: images.filter((image) => image.kind === "local").map((image) => image.file),
    });
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
      <PostImageManager disabled={isCreateRequestPending} images={images} onChange={setImages} />
      <FieldError message={formError} />
      <div className="text-right">
        <Button disabled={!isDirty && !hasImages} loading={isCreateRequestPending} type="submit">
          Post
        </Button>
      </div>
    </FormCard>
  );
};

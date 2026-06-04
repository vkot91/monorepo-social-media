"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { type CreatePostInput, createPostSchema, type PostDto } from "@social/contracts";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { useForm } from "react-hook-form";

import { ApiRequestError } from "#/shared/lib/api/utils/errors";
import { Button } from "#/shared/ui/button";
import { FieldError, FormCard, TextArea } from "#/shared/ui/form";
import { useToastStore } from "#/shared/ui/toast/store/toast";

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
  const queryClient = useQueryClient();
  const { addToast } = useToastStore();

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

  const createPostMutation = useMutation<PostDto, Error, CreatePostMutationInput>({
    mutationKey: postMutationKeys.create,
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
    onSuccess(createdPost) {
      queryClient.setQueriesData<PostsInfiniteData>({ queryKey: postsKeys.infiniteFeedRoot }, (data) =>
        addPostToInfiniteData(data, createdPost),
      );
      reset(createPostDefaultValues);
      setImages([]);
      addToast({ type: "success", description: "Post was successfully created" });
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
      <PostImageManager disabled={createPostMutation.isPending} images={images} onChange={setImages} />
      <FieldError message={formError} />
      <div className="text-right">
        <Button loading={createPostMutation.isPending} type="submit">
          Post
        </Button>
      </div>
    </FormCard>
  );
};

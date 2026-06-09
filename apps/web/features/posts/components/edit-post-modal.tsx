"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { type PostDto, type UpdatePostInput, updatePostSchema } from "@social/contracts";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useId, useState } from "react";
import { useForm } from "react-hook-form";

import { ApiRequestError } from "#/shared/lib/api/utils/errors";
import { Button, Modal } from "#/shared/ui";
import { FieldError, TextArea } from "#/shared/ui/form";
import type { AddToastOptions } from "#/shared/ui/toast/store/toast";

import { type PostsInfiniteData, updatePostInInfiniteData } from "../api/helpers/cache";
import { updatePost, type UpdatePostMutationInput } from "../api/mutations";
import { postsKeys } from "../api/routes";
import {
  buildUpdateImagePayload,
  haveManagedImagesChanged,
  type ManagedPostImage,
  mapPostImagesToManaged,
  PostImageManager,
} from "./post-images";
import { PostVisibilityPicker } from "./post-visibility-picker";

type EditPostModalProps = {
  addToast: (toast: AddToastOptions) => string;
  onOpenChange: (open: boolean) => void;
  open: boolean;
  post: PostDto;
};

type UpdatePostFormValues = {
  content?: string;
  visibility?: UpdatePostInput["visibility"];
};

type UpdatePostVariables = {
  input: UpdatePostMutationInput;
  postId: string;
};

export const EditPostModal = ({ addToast, onOpenChange, open, post }: EditPostModalProps) => {
  const formId = useId();
  const queryClient = useQueryClient();
  const [images, setImages] = useState<ManagedPostImage[]>(() => mapPostImagesToManaged(post.images));

  const {
    formState: { errors, isSubmitting },
    handleSubmit,
    register,
    setError,
    setValue,
    watch,
  } = useForm<UpdatePostFormValues, unknown, UpdatePostInput>({
    defaultValues: {
      content: post.content,
      visibility: post.visibility,
    },
    mode: "onTouched",
    resolver: zodResolver(updatePostSchema),
  });

  const updatePostMutation = useMutation<PostDto, Error, UpdatePostVariables>({
    mutationFn: ({ input, postId }) => updatePost({ input, postId }),
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
    onSuccess: (updatedPost) => {
      queryClient.setQueriesData<PostsInfiniteData>({ queryKey: postsKeys.infiniteFeedRoot }, (data) =>
        updatePostInInfiniteData(data, updatedPost),
      );
      addToast({ type: "success", description: "Post was successfully updated" });
      onOpenChange(false);
    },
  });

  const visibility = watch("visibility");
  const contentError = errors.content?.message;
  const formError = updatePostMutation.error;

  const onSubmit = (values: UpdatePostInput) => {
    const input: UpdatePostMutationInput = {
      content: values.content,
      visibility: values.visibility,
    };

    if (haveManagedImagesChanged(post.images, images)) {
      const { files, imageOrder } = buildUpdateImagePayload(images);

      input.imageOrder = imageOrder;
      input.images = files;
    }

    updatePostMutation.mutate({ input, postId: post.id });
  };

  return (
    <Modal
      description="Update the content and images of your post."
      footer={
        <>
          <Button onClick={() => onOpenChange(false)} variant="secondary">
            Cancel
          </Button>
          <Button form={formId} loading={isSubmitting || updatePostMutation.isPending} type="submit">
            Save changes
          </Button>
        </>
      }
      onOpenChange={onOpenChange}
      open={open}
      title="Edit post"
    >
      <form className="grid gap-4" id={formId} onSubmit={handleSubmit(onSubmit)}>
        <TextArea
          invalid={!!contentError}
          minRows={4}
          aria-label="Post content"
          radius="xl"
          variant="bordered"
          {...register("content")}
        />
        <PostImageManager disabled={updatePostMutation.isPending} images={images} onChange={setImages} />
        <PostVisibilityPicker
          onChange={(v) => setValue("visibility", v)}
          value={visibility ?? post.visibility}
        />
        <FieldError message={contentError || formError?.message} />
      </form>
    </Modal>
  );
};

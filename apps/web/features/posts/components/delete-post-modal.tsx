"use client";

import type { PostDto } from "@social/contracts";
import { useMutation, useQueryClient } from "@tanstack/react-query";

import { Button, Modal } from "#/shared/ui";
import { FieldError } from "#/shared/ui/form";
import type { AddToastOptions } from "#/shared/ui/toast/store/toast";

import {
  type PostsInfiniteData,
  type PostsSnapshot,
  removePostFromInfiniteData,
  restorePostsSnapshot,
} from "../api/helpers/cache";
import { deletePost } from "../api/mutations";
import { postsKeys } from "../api/routes";

type DeletePostModalProps = {
  addToast: (toast: AddToastOptions) => string;
  onOpenChange: (open: boolean) => void;
  open: boolean;
  post: PostDto;
};

export const DeletePostModal = ({ addToast, onOpenChange, open, post }: DeletePostModalProps) => {
  const queryClient = useQueryClient();

  const deletePostMutation = useMutation<null, Error, string, PostsSnapshot>({
    mutationFn: deletePost,
    onMutate: async (postId) => {
      await queryClient.cancelQueries({ queryKey: postsKeys.infiniteFeedRoot });

      const previousPosts = queryClient.getQueriesData<PostsInfiniteData>({
        queryKey: postsKeys.infiniteFeedRoot,
      });

      queryClient.setQueriesData<PostsInfiniteData>({ queryKey: postsKeys.infiniteFeedRoot }, (data) =>
        removePostFromInfiniteData(data, postId),
      );

      return previousPosts;
    },
    onError: (_error, _postId, previousPosts) => {
      restorePostsSnapshot(queryClient, previousPosts);
    },
    onSuccess: () => {
      addToast({ type: "success", description: "Post was successfully removed" });
    },
    onSettled: () => {
      onOpenChange(false);
      queryClient.invalidateQueries({ queryKey: postsKeys.infiniteFeedRoot });
    },
  });

  return (
    <Modal
      description="This action cannot be undone."
      footer={
        <>
          <Button onClick={() => onOpenChange(false)} variant="secondary">
            Cancel
          </Button>
          <Button
            loading={deletePostMutation.isPending}
            onClick={() => deletePostMutation.mutate(post.id)}
            variant="danger"
          >
            Remove post
          </Button>
        </>
      }
      onOpenChange={onOpenChange}
      open={open}
      title="Remove post?"
    >
      <p className="m-0 text-muted-text">Remove this post from the feed?</p>
      <FieldError message={deletePostMutation.error?.message} />
    </Modal>
  );
};

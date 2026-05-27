"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { type PostDto, type UpdatePostInput, updatePostSchema } from "@social/contracts";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Ellipsis, Pencil, Trash2 } from "lucide-react";
import { useId } from "react";
import { useForm } from "react-hook-form";

import { useUser } from "#/features/auth/api/queries";
import { useDisclosure } from "#/shared/hooks/use-disclosure";
import { ApiRequestError } from "#/shared/lib/api/utils/errors";
import { Button, Card, DropdownMenu, Modal } from "#/shared/ui";
import { FieldError, TextArea } from "#/shared/ui/form";
import { type AddToastOptions, useToastStore } from "#/shared/ui/toast/store/toast";

import {
  getOptimisticPost,
  type PostsInfiniteData,
  type PostsSnapshot,
  removePostFromInfiniteData,
  restorePostsSnapshot,
  updatePostInInfiniteData,
} from "../api/helpers/cache";
import { deletePost, updatePost } from "../api/mutations";
import { postsKeys } from "../api/routes";

type PostCardProps = {
  post: PostDto;
};

export const PostCard = ({ post }: PostCardProps) => {
  const { data: activeUser } = useUser();
  const deleteModal = useDisclosure();
  const editModal = useDisclosure();
  const toastStore = useToastStore();

  const isAuthor = post.author.id === activeUser?.id;

  return (
    <Card className="grid gap-4">
      <div className="flex items-start justify-between gap-3.5">
        <div className="flex min-w-0 items-center gap-3.5">
          <div className="h-11 w-11 shrink-0 rounded-full bg-warning" />
          <div className="min-w-0">
            <strong>{post.author.displayName}</strong>
            <p className="mt-1 text-muted-text">@{post.author.username}</p>
          </div>
        </div>
        {isAuthor ? (
          <DropdownMenu
            items={[
              {
                icon: Pencil,
                label: "Edit",
                onSelect: editModal.open,
              },
              {
                icon: Trash2,
                label: "Remove",
                onSelect: deleteModal.open,
                variant: "danger",
              },
            ]}
            label="Open post actions"
            trigger={<Ellipsis aria-hidden className="h-5 w-5" />}
            triggerClassName="h-9 w-9 border-0 p-0"
          />
        ) : null}
      </div>
      <p>{post.content}</p>
      <EditPostModal
        addToast={toastStore.addToast}
        onOpenChange={editModal.onOpenChange}
        open={editModal.isOpen}
        post={post}
      />
      <DeletePostModal
        addToast={toastStore.addToast}
        onOpenChange={deleteModal.onOpenChange}
        open={deleteModal.isOpen}
        post={post}
      />
    </Card>
  );
};

type PostModalProps = {
  onOpenChange: (open: boolean) => void;
  open: boolean;
  post: PostDto;
  addToast: (toast: AddToastOptions) => string;
};

const EditPostModal = ({ onOpenChange, open, post, addToast }: PostModalProps) => {
  const formId = useId();
  const queryClient = useQueryClient();

  const {
    formState: { errors, isSubmitting },
    handleSubmit,
    register,
    setError,
  } = useForm<UpdatePostInput>({
    defaultValues: {
      content: post.content,
    },
    mode: "onTouched",
    resolver: zodResolver(updatePostSchema),
  });

  const updatePostMutation = useMutation<PostDto, Error, { input: UpdatePostInput; postId: string }, PostsSnapshot>({
    mutationFn: updatePost,

    onMutate: async ({ input }) => {
      await queryClient.cancelQueries({ queryKey: postsKeys.infiniteFeedRoot });

      const previousPosts = queryClient.getQueriesData<PostsInfiniteData>({
        queryKey: postsKeys.infiniteFeedRoot,
      });
      const optimisticPost = getOptimisticPost(post, input);

      queryClient.setQueriesData<PostsInfiniteData>({ queryKey: postsKeys.infiniteFeedRoot }, (data) =>
        updatePostInInfiniteData(data, optimisticPost),
      );

      return previousPosts;
    },
    onError: (error, _variables, previousPosts) => {
      restorePostsSnapshot(queryClient, previousPosts);

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
      addToast({ type: "success", description: "Post was successfully updated" });
    },
    onSettled: () => {
      onOpenChange(false);
      queryClient.invalidateQueries({ queryKey: postsKeys.infiniteFeedRoot });
    },
  });

  const contentError = errors.content?.message;
  const formError = updatePostMutation?.error;
  const onSubmit = (values: UpdatePostInput) => {
    updatePostMutation.mutate({
      input: {
        content: values.content,
      },
      postId: post.id,
    });
  };

  return (
    <Modal
      description="Update the content of your post."
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
        <FieldError message={contentError || formError?.message} />
      </form>
    </Modal>
  );
};

const DeletePostModal = ({ onOpenChange, open, post, addToast }: PostModalProps) => {
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

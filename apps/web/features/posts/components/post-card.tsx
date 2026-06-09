"use client";

import type { PostDto } from "@social/contracts";
import { Ellipsis, Pencil, Trash2 } from "lucide-react";

import { useUser } from "#/features/auth/api/queries";
import { useDisclosure } from "#/shared/hooks/use-disclosure";
import { formatRelativeTime } from "#/shared/lib/utils";
import { Card, DropdownMenu } from "#/shared/ui";
import { useToastStore } from "#/shared/ui/toast/store/toast";

import { visibilityConfig } from "../helpers/constants";
import { DeletePostModal } from "./delete-post-modal";
import { EditPostModal } from "./edit-post-modal";
import { PostImageGallery } from "./post-images";

type PostCardProps = {
  post: PostDto;
};

export const PostCard = ({ post }: PostCardProps) => {
  const { data: activeUser } = useUser();
  const deleteModal = useDisclosure();
  const editModal = useDisclosure();
  const toastStore = useToastStore();

  const isAuthor = post.author.id === activeUser?.id;
  const { Icon: VisibilityIcon, label: visibilityLabel } = visibilityConfig[post.visibility];

  return (
    <Card className="grid gap-4">
      <div className="flex items-start justify-between gap-3.5">
        <div className="flex min-w-0 items-center gap-3.5">
          <div className="h-11 w-11 shrink-0 rounded-full bg-warning" />
          <div className="min-w-0">
            <strong>{post.author.displayName}</strong>
            <div className="flex items-center gap-1.5">
              <p className="text-muted-text">@{post.author.username}</p>
              <p className="flex items-center gap-1.5 text-xs text-muted-text">
                <span aria-hidden> · </span>
                <span>{formatRelativeTime(post.createdAt)}</span>
                {isAuthor ? (
                  <>
                    <span aria-hidden>·</span>
                    <VisibilityIcon aria-hidden className="h-3 w-3" />
                    <span>{visibilityLabel}</span>
                  </>
                ) : null}
              </p>
            </div>
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
      <PostImageGallery images={post.images} />
      {editModal.isOpen ? (
        <EditPostModal
          addToast={toastStore.addToast}
          onOpenChange={editModal.onOpenChange}
          open={editModal.isOpen}
          post={post}
        />
      ) : null}
      {deleteModal.isOpen ? (
        <DeletePostModal
          addToast={toastStore.addToast}
          onOpenChange={deleteModal.onOpenChange}
          open={deleteModal.isOpen}
          post={post}
        />
      ) : null}
    </Card>
  );
};

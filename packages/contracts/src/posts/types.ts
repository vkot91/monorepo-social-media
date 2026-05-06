export type PostVisibility = "PUBLIC" | "FRIENDS";

export type CreatePostInput = {
  content: string;
  imageUrl?: string | null;
  visibility?: PostVisibility;
};

export type UpdatePostInput = Partial<CreatePostInput>;

export type PostFeed = "all" | "friends";

export type ListPostsQueryInput = {
  authorId?: string;
  feed?: PostFeed;
};

export type PostAuthorDto = {
  avatarUrl: string | null;
  displayName: string;
  id: string;
  username: string;
};

export type PostDto = {
  author: PostAuthorDto;
  content: string;
  createdAt: string;
  id: string;
  imageUrl: string | null;
  updatedAt: string;
  visibility: PostVisibility;
};

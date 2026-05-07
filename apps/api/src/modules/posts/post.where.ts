import type { ListPostsQueryInput } from "@social/contracts";
import type { Prisma } from "@social/database";
import { FriendshipStatus, PostVisibility } from "@social/database";

export function visiblePostsWhere(
  viewerId: string,
  query: ListPostsQueryInput,
): Prisma.PostWhereInput {
  if (query.authorId) {
    return authorPagePostsForViewer(viewerId, query.authorId);
  }

  if (query.feed === "friends") {
    return friendsPagePosts(viewerId);
  }

  return feedPagePosts(viewerId);
}

// Author pages are scoped by author and block state, except for the viewer's own page.
function authorPagePosts(authorId: string): Prisma.PostWhereInput {
  return {
    authorId,
  };
}

function authorPagePostsForViewer(viewerId: string, authorId: string): Prisma.PostWhereInput {
  if (viewerId === authorId) {
    return authorPagePosts(authorId);
  }

  return {
    AND: [authorPagePosts(authorId), notBlockedByAuthor(viewerId)],
  };
}

// The main feed contains globally public posts, the viewer's own posts, and friends-only posts from accepted friends.
function feedPagePosts(viewerId: string): Prisma.PostWhereInput {
  return {
    OR: [
      postsByAuthor(viewerId),
      {
        AND: [publicPosts(), notBlockedByAuthor(viewerId)],
      },
      {
        AND: [
          {
            author: acceptedFriendOf(viewerId),
            visibility: PostVisibility.FRIENDS,
          },
          notBlockedByAuthor(viewerId),
        ],
      },
    ],
  };
}

// The friends page contains posts authored by accepted friends, including public and friends-only visibility.
function friendsPagePosts(viewerId: string): Prisma.PostWhereInput {
  return {
    AND: [
      {
        author: acceptedFriendOf(viewerId),
      },
      notBlockedByAuthor(viewerId),
    ],
    visibility: {
      in: [PostVisibility.PUBLIC, PostVisibility.FRIENDS],
    },
  };
}

// Matches posts authored by the given user.
function postsByAuthor(authorId: string): Prisma.PostWhereInput {
  return {
    authorId,
  };
}

// Matches posts that are visible to everyone.
function publicPosts(): Prisma.PostWhereInput {
  return {
    visibility: PostVisibility.PUBLIC,
  };
}

// Excludes posts from authors who blocked the viewer. The viewer's own posts are handled separately.
function notBlockedByAuthor(viewerId: string): Prisma.PostWhereInput {
  return {
    author: {
      blockedUsers: {
        none: {
          blockedId: viewerId,
        },
      },
    },
  };
}

// Matches users who have an accepted friendship with the viewer in either direction.
function acceptedFriendOf(viewerId: string): Prisma.UserWhereInput {
  return {
    OR: [
      {
        sentFriendshipRequests: acceptedFriendshipWith({
          addresseeId: viewerId,
        }),
      },
      {
        receivedFriendshipRequests: acceptedFriendshipWith({
          requesterId: viewerId,
        }),
      },
    ],
  };
}

// Wraps one side of the friendship relation in Prisma's list relation filter.
function acceptedFriendshipWith(
  viewerSide: Pick<Prisma.FriendshipWhereInput, "addresseeId" | "requesterId">,
): Prisma.FriendshipListRelationFilter {
  return {
    some: {
      ...viewerSide,
      status: FriendshipStatus.ACCEPTED,
    },
  };
}

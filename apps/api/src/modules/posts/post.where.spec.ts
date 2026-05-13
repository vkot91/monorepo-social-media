import { FriendshipStatus, PostVisibility } from "@social/database";

import { visiblePostsWhere } from "./post.where";

const acceptedFriendOfViewer = {
  OR: [
    {
      sentFriendshipRequests: {
        some: {
          addresseeId: "viewer-1",
          status: FriendshipStatus.ACCEPTED,
        },
      },
    },
    {
      receivedFriendshipRequests: {
        some: {
          requesterId: "viewer-1",
          status: FriendshipStatus.ACCEPTED,
        },
      },
    },
  ],
};

const notBlockedByAuthor = {
  author: {
    blockedUsers: {
      none: {
        blockedId: "viewer-1",
      },
    },
  },
};

describe("visiblePostsWhere", () => {
  it("returns all posts on the viewer's own author page", () => {
    expect(
      visiblePostsWhere("viewer-1", {
        authorId: "viewer-1",
      }),
    ).toEqual({
      authorId: "viewer-1",
    });
  });

  it("returns another author's page scoped to that author and excludes authors who blocked the viewer", () => {
    expect(
      visiblePostsWhere("viewer-1", {
        authorId: "author-1",
      }),
    ).toEqual({
      AND: [
        {
          authorId: "author-1",
        },
        notBlockedByAuthor,
      ],
    });
  });

  it("returns global feed posts visible to the viewer", () => {
    expect(visiblePostsWhere("viewer-1", { feed: "all" })).toEqual({
      OR: [
        {
          authorId: "viewer-1",
        },
        {
          AND: [
            {
              visibility: PostVisibility.PUBLIC,
            },
            notBlockedByAuthor,
          ],
        },
        {
          AND: [
            {
              author: acceptedFriendOfViewer,
              visibility: PostVisibility.FRIENDS,
            },
            notBlockedByAuthor,
          ],
        },
      ],
    });
  });

  it("excludes public feed posts from authors who blocked the viewer", () => {
    const where = visiblePostsWhere("viewer-1", { feed: "all" });

    expect(where).toMatchObject({
      OR: expect.arrayContaining([
        {
          AND: [
            {
              visibility: PostVisibility.PUBLIC,
            },
            notBlockedByAuthor,
          ],
        },
      ]),
    });
  });

  it("excludes friends-only feed posts from friends who blocked the viewer", () => {
    const where = visiblePostsWhere("viewer-1", { feed: "all" });

    expect(where).toMatchObject({
      OR: expect.arrayContaining([
        {
          AND: [
            {
              author: acceptedFriendOfViewer,
              visibility: PostVisibility.FRIENDS,
            },
            notBlockedByAuthor,
          ],
        },
      ]),
    });
  });

  it("returns friends feed posts from the viewer or accepted friends only", () => {
    expect(visiblePostsWhere("viewer-1", { feed: "friends" })).toEqual({
      OR: [
        {
          authorId: "viewer-1",
        },
        {
          AND: [
            {
              author: acceptedFriendOfViewer,
              visibility: {
                in: [PostVisibility.PUBLIC, PostVisibility.FRIENDS],
              },
            },
            notBlockedByAuthor,
          ],
        },
      ],
    });
  });

  it("excludes friends page posts from friends who blocked the viewer", () => {
    const where = visiblePostsWhere("viewer-1", { feed: "friends" });

    expect(where).toMatchObject({
      OR: expect.arrayContaining([
        {
          AND: [
            {
              author: acceptedFriendOfViewer,
              visibility: {
                in: [PostVisibility.PUBLIC, PostVisibility.FRIENDS],
              },
            },
            notBlockedByAuthor,
          ],
        },
      ]),
    });
  });

  it("uses global feed behavior when no feed or author filter is provided", () => {
    expect(visiblePostsWhere("viewer-1", {})).toEqual(visiblePostsWhere("viewer-1", { feed: "all" }));
  });
});

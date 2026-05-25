const mayaFeedPost = {
  content: "Planning a weekend photo walk downtown.",
  createdAt: "2026-05-21T12:00:00.000Z",
  id: "10000000-0000-4000-8000-000000000001",
};

const paginationPosts = Array.from({ length: 20 }, (_item, index) => {
  const postNumber = index + 2;
  const day = String(22 - postNumber).padStart(2, "0");

  return {
    content: `Seeded cursor page post ${postNumber}`,
    createdAt: `2026-05-${day}T12:00:00.000Z`,
    id: `10000000-0000-4000-8000-${String(postNumber).padStart(12, "0")}`,
  };
});

const mayaFeedPage = [mayaFeedPost, ...paginationPosts];

export const testPosts = {
  createdPost: {
    content: "Writing real e2e tests against Postgres.",
  },
  mayaFeed: mayaFeedPost,
  mayaFeedPage,
};

import { developmentUsers } from "./user.seed";

const paginationPosts = Array.from({ length: 20 }, (_item, index) => {
  const postNumber = index + 2;
  const day = String(22 - postNumber).padStart(2, "0");

  const post = {
    content: `Seeded cursor page post ${postNumber}`,
    createdAt: `2026-05-${day}T12:00:00.000Z`,
    id: `10000000-0000-4000-8000-${String(postNumber).padStart(12, "0")}`,
  };

  return [`pagination${postNumber}`, post] as const;
});

const developmentPostEntries = Object.values(developmentUsers).flatMap((user, userIndex) =>
  Array.from({ length: 10 }, (_item, postIndex) => {
    const postNumber = postIndex + 1;
    const sequence = userIndex * 10 + postNumber;
    const dayOffset = Math.floor((sequence - 1) / 2);
    const hourOffset = 12 - (sequence % 10);
    const base = new Date("2026-05-27T12:00:00.000Z");
    base.setUTCDate(base.getUTCDate() - dayOffset);
    base.setUTCHours(hourOffset);
    const post = {
      authorId: user.id,
      content: `${user.displayName} development post ${postNumber}: sharing a seeded feed update for local testing.`,
      createdAt: base.toISOString(),
      id: `30000000-0000-4000-8000-${String(sequence).padStart(12, "0")}`,
    };

    return [post.id, post] as const;
  }),
);

export const posts = {
  development: Object.fromEntries(developmentPostEntries),
  test: {
    createdPost: {
      content: "Writing real e2e tests against Postgres.",
    },
    mayaFeed: {
      content: "Planning a weekend photo walk downtown.",
      createdAt: "2026-05-21T12:00:00.000Z",
      id: "10000000-0000-4000-8000-000000000001",
    },
    pagination: Object.fromEntries(paginationPosts),
  },
} as const;

export const testPosts = {
  createdPost: posts.test.createdPost,
  mayaFeed: posts.test.mayaFeed,
  mayaFeedPage: [posts.test.mayaFeed, ...Object.values(posts.test.pagination)],
} as const;

export const developmentPosts = Object.values(posts.development);

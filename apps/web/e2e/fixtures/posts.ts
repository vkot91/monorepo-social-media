export const posts = [
  {
    author: {
      avatarUrl: null,
      displayName: "Maya Johnson",
      id: "author-1",
      username: "maya",
    },
    content: "Planning a weekend photo walk downtown.",
    createdAt: "2026-05-07T10:00:00.000Z",
    id: "post-1",
    imageUrl: null,
    updatedAt: "2026-05-07T10:00:00.000Z",
    visibility: "PUBLIC",
  },
];

const defaultScenario = "posts";

export const postScenarios = {
  empty: {
    body: [],
    status: 200,
  },
  posts: {
    body: posts,
    status: 200,
  },
  unavailable: {
    body: { message: "API unavailable" },
    status: 503,
  },
};

export const getPostScenario = (scenario: keyof typeof postScenarios = defaultScenario) =>
  postScenarios[scenario] ?? postScenarios[defaultScenario];

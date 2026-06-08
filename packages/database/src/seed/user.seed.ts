export const testUsers = {
  empty: {
    displayName: "Empty Feed",
    email: "empty@example.com",
    id: "00000000-0000-4000-8000-000000000003",
    username: "empty_feed",
  },
  login: {
    displayName: "Maya Johnson",
    email: "maya@example.com",
    id: "00000000-0000-4000-8000-000000000001",
    username: "maya",
  },
  taken: {
    displayName: "Taken Account",
    email: "taken@example.com",
    id: "00000000-0000-4000-8000-000000000002",
    username: "taken",
  },
} as const;

export const developmentOnlyUsers = {
  alex: {
    displayName: "Alex Rivera",
    email: "alex@example.com",
    id: "00000000-0000-4000-8000-000000000004",
    username: "alex_r",
  },
  priya: {
    displayName: "Priya Nair",
    email: "priya@example.com",
    id: "00000000-0000-4000-8000-000000000005",
    username: "priya_n",
  },
  jordan: {
    displayName: "Jordan Blake",
    email: "jordan@example.com",
    id: "00000000-0000-4000-8000-000000000006",
    username: "jordan_b",
  },
  sam: {
    displayName: "Sam Carter",
    email: "sam@example.com",
    id: "00000000-0000-4000-8000-000000000007",
    username: "sam_c",
  },
  lee: {
    displayName: "Lee Park",
    email: "lee@example.com",
    id: "00000000-0000-4000-8000-000000000008",
    username: "lee_p",
  },
} as const;

export const developmentUsers = [
  ...Object.values(testUsers),
  ...Object.values(developmentOnlyUsers),
];

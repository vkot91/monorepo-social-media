import { developmentOnlyUsers, testUsers } from "./user.seed";

const u = {
  maya: testUsers.login.id,
  taken: testUsers.taken.id,
  empty: testUsers.empty.id,
  alex: developmentOnlyUsers.alex.id,
  priya: developmentOnlyUsers.priya.id,
  jordan: developmentOnlyUsers.jordan.id,
  sam: developmentOnlyUsers.sam.id,
  lee: developmentOnlyUsers.lee.id,
};

// Deterministic friendships required by the e2e suite: maya can start a
// conversation with taken because they are accepted friends and not blocked.
// The pair intentionally excludes `empty` so the empty-feed fixture stays
// isolated (an accepted friend with posts would leak into empty's feed).
export const testFriendships = [
  {
    id: "f0000000-0000-4000-8000-000000000101",
    requesterId: u.maya,
    addresseeId: u.taken,
    status: "ACCEPTED" as const,
    createdAt: new Date("2026-05-02T10:00:00.000Z"),
  },
];

export const developmentFriendships = [
  // Accepted friendships
  {
    id: "f0000000-0000-4000-8000-000000000001",
    requesterId: u.maya,
    addresseeId: u.alex,
    status: "ACCEPTED" as const,
    createdAt: new Date("2026-05-02T10:00:00.000Z"),
  },
  {
    id: "f0000000-0000-4000-8000-000000000002",
    requesterId: u.priya,
    addresseeId: u.maya,
    status: "ACCEPTED" as const,
    createdAt: new Date("2026-05-03T11:00:00.000Z"),
  },
  {
    id: "f0000000-0000-4000-8000-000000000003",
    requesterId: u.alex,
    addresseeId: u.jordan,
    status: "ACCEPTED" as const,
    createdAt: new Date("2026-05-04T09:00:00.000Z"),
  },
  {
    id: "f0000000-0000-4000-8000-000000000004",
    requesterId: u.sam,
    addresseeId: u.priya,
    status: "ACCEPTED" as const,
    createdAt: new Date("2026-05-05T14:00:00.000Z"),
  },
  {
    id: "f0000000-0000-4000-8000-000000000005",
    requesterId: u.jordan,
    addresseeId: u.lee,
    status: "ACCEPTED" as const,
    createdAt: new Date("2026-05-06T08:00:00.000Z"),
  },
  // Pending requests
  {
    id: "f0000000-0000-4000-8000-000000000006",
    requesterId: u.lee,
    addresseeId: u.maya,
    status: "PENDING" as const,
    createdAt: new Date("2026-05-20T15:00:00.000Z"),
  },
  {
    id: "f0000000-0000-4000-8000-000000000007",
    requesterId: u.taken,
    addresseeId: u.alex,
    status: "PENDING" as const,
    createdAt: new Date("2026-05-21T16:00:00.000Z"),
  },
  {
    id: "f0000000-0000-4000-8000-000000000008",
    requesterId: u.sam,
    addresseeId: u.jordan,
    status: "PENDING" as const,
    createdAt: new Date("2026-05-22T10:00:00.000Z"),
  },
  // Rejected
  {
    id: "f0000000-0000-4000-8000-000000000009",
    requesterId: u.empty,
    addresseeId: u.priya,
    status: "REJECTED" as const,
    createdAt: new Date("2026-05-10T12:00:00.000Z"),
  },
];

export const developmentBlocks = [
  { blockerId: u.maya, blockedId: u.taken, createdAt: new Date("2026-05-15T10:00:00.000Z") },
  { blockerId: u.alex, blockedId: u.empty, createdAt: new Date("2026-05-16T11:00:00.000Z") },
  { blockerId: u.jordan, blockedId: u.sam, createdAt: new Date("2026-05-17T12:00:00.000Z") },
];

const pairKey = (a: string, b: string) => [a, b].sort().join(":");

export const developmentConversations = [
  {
    id: "c0000000-0000-4000-8000-000000000001",
    pairKey: pairKey(u.maya, u.alex),
    participants: [u.maya, u.alex],
    lastMessageAt: new Date("2026-05-25T14:30:00.000Z"),
    createdAt: new Date("2026-05-10T08:00:00.000Z"),
  },
  {
    id: "c0000000-0000-4000-8000-000000000002",
    pairKey: pairKey(u.maya, u.priya),
    participants: [u.maya, u.priya],
    lastMessageAt: new Date("2026-05-26T09:15:00.000Z"),
    createdAt: new Date("2026-05-11T09:00:00.000Z"),
  },
  {
    id: "c0000000-0000-4000-8000-000000000003",
    pairKey: pairKey(u.alex, u.jordan),
    participants: [u.alex, u.jordan],
    lastMessageAt: new Date("2026-05-24T18:00:00.000Z"),
    createdAt: new Date("2026-05-12T10:00:00.000Z"),
  },
  {
    id: "c0000000-0000-4000-8000-000000000004",
    pairKey: pairKey(u.sam, u.priya),
    participants: [u.sam, u.priya],
    lastMessageAt: new Date("2026-05-23T11:45:00.000Z"),
    createdAt: new Date("2026-05-13T11:00:00.000Z"),
  },
];

export const developmentMessages = [
  // maya <-> alex
  {
    id: "a0000000-0000-4000-8000-000000000001",
    conversationId: "c0000000-0000-4000-8000-000000000001",
    senderId: u.maya,
    content: "Hey Alex! How's it going?",
    createdAt: new Date("2026-05-25T14:00:00.000Z"),
  },
  {
    id: "a0000000-0000-4000-8000-000000000002",
    conversationId: "c0000000-0000-4000-8000-000000000001",
    senderId: u.alex,
    content: "Hey Maya! Doing great, just finished a hike. You?",
    createdAt: new Date("2026-05-25T14:10:00.000Z"),
  },
  {
    id: "a0000000-0000-4000-8000-000000000003",
    conversationId: "c0000000-0000-4000-8000-000000000001",
    senderId: u.maya,
    content: "Same here, working on some photos from last weekend.",
    createdAt: new Date("2026-05-25T14:20:00.000Z"),
  },
  {
    id: "a0000000-0000-4000-8000-000000000004",
    conversationId: "c0000000-0000-4000-8000-000000000001",
    senderId: u.alex,
    content: "Nice! Would love to see them when they're ready.",
    createdAt: new Date("2026-05-25T14:30:00.000Z"),
  },
  // maya <-> priya
  {
    id: "a0000000-0000-4000-8000-000000000005",
    conversationId: "c0000000-0000-4000-8000-000000000002",
    senderId: u.priya,
    content: "Are you coming to the meetup next week?",
    createdAt: new Date("2026-05-26T09:00:00.000Z"),
  },
  {
    id: "a0000000-0000-4000-8000-000000000006",
    conversationId: "c0000000-0000-4000-8000-000000000002",
    senderId: u.maya,
    content: "Definitely! Looking forward to it.",
    createdAt: new Date("2026-05-26T09:10:00.000Z"),
  },
  {
    id: "a0000000-0000-4000-8000-000000000007",
    conversationId: "c0000000-0000-4000-8000-000000000002",
    senderId: u.priya,
    content: "Great, I'll save you a seat!",
    createdAt: new Date("2026-05-26T09:15:00.000Z"),
  },
  // alex <-> jordan
  {
    id: "a0000000-0000-4000-8000-000000000008",
    conversationId: "c0000000-0000-4000-8000-000000000003",
    senderId: u.alex,
    content: "Did you see the game last night?",
    createdAt: new Date("2026-05-24T17:30:00.000Z"),
  },
  {
    id: "a0000000-0000-4000-8000-000000000009",
    conversationId: "c0000000-0000-4000-8000-000000000003",
    senderId: u.jordan,
    content: "Yes! Incredible ending.",
    createdAt: new Date("2026-05-24T17:45:00.000Z"),
  },
  {
    id: "a0000000-0000-4000-8000-000000000010",
    conversationId: "c0000000-0000-4000-8000-000000000003",
    senderId: u.alex,
    content: "We should catch the next one together.",
    createdAt: new Date("2026-05-24T18:00:00.000Z"),
  },
  // sam <-> priya
  {
    id: "a0000000-0000-4000-8000-000000000011",
    conversationId: "c0000000-0000-4000-8000-000000000004",
    senderId: u.sam,
    content: "Hey, got your recommendation. Thanks!",
    createdAt: new Date("2026-05-23T11:30:00.000Z"),
  },
  {
    id: "a0000000-0000-4000-8000-000000000012",
    conversationId: "c0000000-0000-4000-8000-000000000004",
    senderId: u.priya,
    content: "Of course! Let me know how it goes.",
    createdAt: new Date("2026-05-23T11:45:00.000Z"),
  },
];

import { listPostsQuerySchema } from "@social/contracts";

import { PostsController } from "./posts.controller";
import type { PostsService } from "./posts.service";

describe("PostsController", () => {
  const postsService = {
    create: jest.fn(),
    findOne: jest.fn(),
    list: jest.fn(),
    remove: jest.fn(),
    update: jest.fn(),
  } as unknown as jest.Mocked<PostsService>;

  const controller = new PostsController(postsService);
  const user = {
    email: "ada@example.com",
    sub: "user-1",
    type: "access" as const,
    username: "ada",
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("delegates post creation for the authenticated user", async () => {
    const dto = {
      content: "Hello world",
      visibility: "PUBLIC" as const,
    };

    await controller.create(user, dto);

    expect(postsService.create).toHaveBeenCalledWith("user-1", dto);
  });

  it("delegates post listing with query params for the authenticated user", async () => {
    const query = {
      feed: "friends" as const,
    };

    await controller.list(user, query);

    expect(postsService.list).toHaveBeenCalledWith("user-1", query);
  });

  it("delegates single post lookup for the authenticated user", async () => {
    await controller.findOne(user, "post-1");

    expect(postsService.findOne).toHaveBeenCalledWith("user-1", "post-1");
  });

  it("delegates updates for the authenticated user", async () => {
    const dto = {
      content: "Updated",
      visibility: "FRIENDS" as const,
    };

    await controller.update(user, "post-1", dto);

    expect(postsService.update).toHaveBeenCalledWith("user-1", "post-1", dto);
  });

  it("delegates deletion for the authenticated user", async () => {
    await controller.remove(user, "post-1");

    expect(postsService.remove).toHaveBeenCalledWith("user-1", "post-1");
  });
});

describe("listPostsQuerySchema", () => {
  it("accepts all and friends feeds", () => {
    expect(listPostsQuerySchema.safeParse({ feed: "all" }).success).toBe(true);
    expect(listPostsQuerySchema.safeParse({ feed: "friends" }).success).toBe(true);
  });

  it("rejects mine feed because authorId should be used for current-user posts", () => {
    expect(listPostsQuerySchema.safeParse({ feed: "mine" }).success).toBe(false);
  });

  it("rejects combining feed and authorId", () => {
    expect(
      listPostsQuerySchema.safeParse({
        authorId: "11111111-1111-4111-8111-111111111111",
        feed: "friends",
      }).success,
    ).toBe(false);
  });
});

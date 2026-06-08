import type { INestApplication } from "@nestjs/common";
import type { PaginatedPostsDto, PostDto } from "@social/contracts";
import { prisma, testPosts, testUsers } from "@social/database";

import { closeTestApp, createTestApp } from "#e2e/support/create-app";
import { loginAs, makeRequest, type RequestFn } from "#e2e/support/request";

let app: INestApplication;
let request: RequestFn;

beforeAll(async () => {
  app = await createTestApp();
  request = makeRequest(await app.getUrl());
});

afterAll(async () => {
  await closeTestApp(app);
});

describe("posts", () => {
  it("lists and creates posts", async () => {
    const { accessToken } = await loginAs(request);
    const authHeaders = { authorization: `Bearer ${accessToken}` };

    const initialPosts = await request<PaginatedPostsDto>("/posts?feed=all&limit=20", { headers: authHeaders });

    expect(initialPosts.response.status).toBe(200);
    expect(initialPosts.body.items).toEqual(
      expect.arrayContaining([expect.objectContaining({ content: testPosts.mayaFeed.content })]),
    );
    expect(initialPosts.body.pageInfo).toMatchObject({ hasNextPage: true, limit: 20, mode: "cursor" });

    if (initialPosts.body.pageInfo.mode !== "cursor" || !initialPosts.body.pageInfo.nextCursor) {
      throw new Error("Expected the first posts page to include a next cursor.");
    }

    const lastSeedPost = testPosts.mayaFeedPage.at(-1);

    if (!lastSeedPost) {
      throw new Error("Expected seeded posts fixture to include a final cursor page post.");
    }

    const nextPosts = await request<PaginatedPostsDto>(
      `/posts?feed=all&limit=20&cursor=${encodeURIComponent(initialPosts.body.pageInfo.nextCursor)}`,
      { headers: authHeaders },
    );

    expect(nextPosts.response.status).toBe(200);
    expect(nextPosts.body).toMatchObject({
      items: [expect.objectContaining({ content: lastSeedPost.content })],
      pageInfo: { hasNextPage: false, limit: 20, mode: "cursor", nextCursor: null },
    });

    const formData = new FormData();
    formData.append("content", testPosts.createdPost.content);

    const createdPost = await request<{ content: string }>("/posts", {
      body: formData,
      headers: authHeaders,
      method: "POST",
    });

    expect(createdPost.response.status).toBe(201);
    expect(createdPost.body).toMatchObject({ content: testPosts.createdPost.content });
    await expect(
      prisma.post.count({ where: { authorId: testUsers.login.id } }),
    ).resolves.toBe(testPosts.mayaFeedPage.length + 1);
  });

  it("updates an owned post", async () => {
    const { accessToken } = await loginAs(request);
    const authHeaders = { authorization: `Bearer ${accessToken}` };
    const formData = new FormData();
    formData.append("content", "Updated from an e2e test.");
    formData.append("visibility", "PUBLIC");

    const updatedPost = await request<PostDto>(`/posts/${testPosts.mayaFeed.id}`, {
      body: formData,
      headers: authHeaders,
      method: "PATCH",
    });

    expect(updatedPost.response.status).toBe(200);
    expect(updatedPost.body).toMatchObject({
      author: expect.objectContaining({ id: testUsers.login.id, username: testUsers.login.username }),
      content: "Updated from an e2e test.",
      id: testPosts.mayaFeed.id,
      visibility: "PUBLIC",
    });
    await expect(
      prisma.post.findUnique({ where: { id: testPosts.mayaFeed.id } }),
    ).resolves.toMatchObject({ content: "Updated from an e2e test.", visibility: "PUBLIC" });
  });

  it("removes an owned post", async () => {
    const { accessToken } = await loginAs(request);
    const authHeaders = { authorization: `Bearer ${accessToken}` };
    const formData = new FormData();
    formData.append("content", "Temporary post for delete coverage.");

    const createdPost = await request<PostDto>("/posts", {
      body: formData,
      headers: authHeaders,
      method: "POST",
    });

    expect(createdPost.response.status).toBe(201);

    const removedPost = await request(`/posts/${createdPost.body.id}`, {
      headers: authHeaders,
      method: "DELETE",
    });

    expect(removedPost.response.status).toBe(204);
    expect(removedPost.body).toBeNull();
    await expect(prisma.post.findUnique({ where: { id: createdPost.body.id } })).resolves.toBeNull();
  });

  it("rejects edits and removals from non-authors", async () => {
    const { accessToken } = await loginAs(request, testUsers.empty.email);
    const authHeaders = { authorization: `Bearer ${accessToken}` };

    const updateResponse = await request<{ message: string }>(`/posts/${testPosts.mayaFeed.id}`, {
      body: JSON.stringify({ content: "Attempted overwrite." }),
      headers: authHeaders,
      method: "PATCH",
    });

    expect(updateResponse.response.status).toBe(403);
    expect(updateResponse.body.message).toBe("You cannot modify this post");

    const removeResponse = await request<{ message: string }>(`/posts/${testPosts.mayaFeed.id}`, {
      headers: authHeaders,
      method: "DELETE",
    });

    expect(removeResponse.response.status).toBe(403);
    expect(removeResponse.body.message).toBe("You cannot modify this post");
    await expect(prisma.post.findUnique({ where: { id: testPosts.mayaFeed.id } })).resolves.toMatchObject({
      content: testPosts.mayaFeed.content,
    });
  });
});

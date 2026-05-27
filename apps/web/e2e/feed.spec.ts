import { expect, test } from "@playwright/test";
import { PostVisibility, prisma, testPosts, testUsers } from "@social/database";

import { authenticate } from "./support/auth";
import { resetDatabase } from "./support/database";

const buildPost = (post: (typeof testPosts.mayaFeedPage)[number]) => ({
  author: {
    avatarUrl: null,
    displayName: testUsers.login.displayName,
    id: testUsers.login.id,
    username: testUsers.login.username,
  },
  content: post.content,
  createdAt: post.createdAt,
  id: post.id,
  imageUrl: null,
  updatedAt: post.createdAt,
  visibility: "FRIENDS",
});

test.describe("feed page", () => {
  test.beforeEach(async () => {
    await resetDatabase();
  });

  test("redirects unauthenticated users to login", async ({ page }) => {
    await page.goto("/feed");

    await expect(page).toHaveURL(/\/login(?:\?next=%2Ffeed)?$/);
    await expect(page.getByRole("heading", { name: "Welcome back" })).toBeVisible();
  });

  test("renders posts for authenticated users", async ({ context, page, baseURL }) => {
    await authenticate(context, baseURL!, "posts");

    await page.goto("/feed");

    await expect(page.getByRole("heading", { name: "Your feed" })).toBeVisible();
    await expect(page.getByRole("link", { name: "Home" })).toHaveAttribute("href", "/feed");
    await expect(page.getByRole("button", { name: "Open account menu" })).toBeVisible();
    await expect(page.getByLabel("Create post")).toHaveAttribute("placeholder", "What are you building today?");
    await expect(page.getByLabel("Posts", { exact: true })).toContainText(testUsers.login.displayName);
    await expect(page.getByLabel("Posts", { exact: true })).toContainText(testPosts.mayaFeed.content);
  });

  test("edits an authored post from the feed", async ({ context, page, baseURL }) => {
    await authenticate(context, baseURL!, "posts");

    await page.goto("/feed");

    await page.getByRole("button", { name: "Open post actions" }).first().click();
    await page.getByRole("menuitem", { name: "Edit" }).click();
    await page.getByLabel("Post content").fill("Updated from the web e2e test.");
    await page.getByRole("button", { name: "Save changes" }).click();

    await expect(page.getByText("Updated from the web e2e test.", { exact: true })).toBeVisible();
    await expect(page.getByRole("list", { name: "top right notifications" }).getByRole("status")).toContainText(
      "Post was successfully updated",
    );
    await expect
      .poll(async () => {
        const post = await prisma.post.findUnique({
          where: {
            id: testPosts.mayaFeed.id,
          },
        });

        return post?.content;
      })
      .toBe("Updated from the web e2e test.");
  });

  test("removes an authored post from the feed", async ({ context, page, baseURL }) => {
    await authenticate(context, baseURL!, "posts");

    await page.goto("/feed");

    await page.getByRole("button", { name: "Open post actions" }).first().click();
    await page.getByRole("menuitem", { name: "Remove" }).click();

    await expect(page.getByRole("dialog", { name: "Remove post?" })).toContainText("This action cannot be undone.");

    await page.getByRole("button", { name: "Remove post" }).click();

    await expect(page.getByText(testPosts.mayaFeed.content, { exact: true })).toBeHidden();
    await expect(page.getByRole("list", { name: "top right notifications" }).getByRole("status")).toContainText(
      "Post was successfully removed",
    );
    await expect
      .poll(async () => {
        const post = await prisma.post.findUnique({
          where: {
            id: testPosts.mayaFeed.id,
          },
        });

        return post;
      })
      .toBeNull();
  });

  test("hides post edit and remove actions from non-authors", async ({ context, page, baseURL }) => {
    await prisma.post.update({
      data: {
        visibility: PostVisibility.PUBLIC,
      },
      where: {
        id: testPosts.mayaFeed.id,
      },
    });
    await authenticate(context, baseURL!, "empty");

    await page.goto("/feed");

    await expect(page.getByText(testPosts.mayaFeed.content, { exact: true })).toBeVisible();
    await expect(page.getByRole("button", { name: "Open post actions" })).toBeHidden();
  });

  test("renders the empty feed state", async ({ context, page, baseURL }) => {
    await authenticate(context, baseURL!, "empty");

    await page.goto("/feed");

    await expect(page.getByRole("heading", { name: "No posts yet" })).toBeVisible();
    await expect(page.getByText("This placeholder is ready for the feed")).toBeVisible();
  });

  test("shows an error toast when post creation fails", async ({ context, page, baseURL }) => {
    await authenticate(context, baseURL!, "posts");
    await page.route("**/api/posts", async (route) => {
      if (route.request().method() !== "POST") {
        await route.fallback();
        return;
      }

      await route.fulfill({
        contentType: "application/json",
        json: {
          message: "Post creation is unavailable right now.",
        },
        status: 503,
      });
    });

    await page.goto("/feed");

    await page.getByLabel("Create post").fill("This post should show an error toast.");
    await page.getByRole("button", { name: "Post", exact: true }).click();

    await expect(page.getByRole("list", { name: "top right notifications" }).getByRole("alert")).toContainText(
      "Post creation is unavailable right now.",
    );
    await expect(page.getByRole("button", { name: "Dismiss toast" })).toBeVisible();
  });

  test("loads the next page of posts when the feed bottom is reached", async ({ context, page, baseURL }) => {
    await authenticate(context, baseURL!, "posts");
    const lastSeedPost = testPosts.mayaFeedPage.at(-1);

    if (!lastSeedPost) {
      throw new Error("Expected seeded posts fixture to include a final cursor page post.");
    }

    await page.route("**/api/posts?**", async (route) => {
      const url = new URL(route.request().url());
      const isNextPage = url.searchParams.get("cursor") === "cursor-1";
      const pagePosts = isNextPage ? testPosts.mayaFeedPage.slice(20) : testPosts.mayaFeedPage.slice(0, 20);

      await route.fulfill({
        contentType: "application/json",
        json: {
          items: pagePosts.map(buildPost),
          pageInfo: {
            hasNextPage: !isNextPage,
            limit: 20,
            mode: "cursor",
            nextCursor: isNextPage ? null : "cursor-1",
          },
        },
      });
    });

    await page.goto("/feed");

    await expect(page.getByText(testPosts.mayaFeed.content, { exact: true })).toBeVisible();
    await expect(page.getByText(lastSeedPost.content, { exact: true })).toBeHidden();

    await page.evaluate(() => {
      window.scrollTo(0, document.documentElement.scrollHeight);
    });

    await expect(page.getByText(lastSeedPost.content, { exact: true })).toBeVisible();
    await expect(page.getByRole("button", { name: "Load more posts" })).toBeHidden();
  });

  test("signs out and returns to login", async ({ context, page, baseURL }) => {
    await authenticate(context, baseURL!, "posts");
    await page.goto("/feed");

    await page.getByRole("button", { name: "Open account menu" }).click();
    await page.getByRole("menuitem", { name: "Logout" }).click();

    await expect(page).toHaveURL(/\/login$/);
    await expect(page.getByRole("heading", { name: "Welcome back" })).toBeVisible();
  });
});

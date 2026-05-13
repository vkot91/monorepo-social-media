import { expect, test } from "@playwright/test";
import { authenticate } from "./support/auth";

test.describe("feed page", () => {
  test("redirects unauthenticated users to login", async ({ page }) => {
    await page.goto("/feed");

    await expect(page).toHaveURL(/\/login(?:\?next=%2Ffeed)?$/);
    await expect(page.getByRole("heading", { name: "Welcome back" })).toBeVisible();
  });

  test("renders posts for authenticated users", async ({ context, page, baseURL }) => {
    await authenticate(context, baseURL!, "posts");

    await page.goto("/feed");

    await expect(page.getByRole("heading", { name: "Your feed" })).toBeVisible();
    await expect(page.getByRole("link", { name: "Feed" })).toHaveAttribute("href", "/feed");
    await expect(page.getByRole("button", { name: "Sign out" })).toBeVisible();
    await expect(page.getByLabel("Create post")).toContainText("What would you like to share?");
    await expect(page.getByLabel("Posts")).toContainText("Maya Johnson");
    await expect(page.getByLabel("Posts")).toContainText("Planning a weekend photo walk downtown.");
  });

  test("renders the empty feed state", async ({ context, page, baseURL }) => {
    await authenticate(context, baseURL!, "empty");

    await page.goto("/feed");

    await expect(page.getByRole("heading", { name: "No posts yet" })).toBeVisible();
    await expect(page.getByText("This placeholder is ready for the feed")).toBeVisible();
  });

  test("renders an unavailable state when the API fails", async ({ context, page, baseURL }) => {
    await authenticate(context, baseURL!, "unavailable");

    await page.goto("/feed");

    await expect(
      page.getByRole("heading", { name: "Feed is temporarily unavailable" }),
    ).toBeVisible();
    await expect(page.getByText("The API could not be reached")).toBeVisible();
  });

  test("signs out and returns to login", async ({ context, page, baseURL }) => {
    await authenticate(context, baseURL!, "posts");
    await page.goto("/feed");

    await page.getByRole("button", { name: "Sign out" }).click();

    await expect(page).toHaveURL(/\/login$/);
    await expect(page.getByRole("heading", { name: "Welcome back" })).toBeVisible();
  });
});

import { expect, test } from "@playwright/test";

import { authenticate } from "./support/auth";
import { resetDatabase } from "./support/database";

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
    await expect(page.getByLabel("Posts", { exact: true })).toContainText("Maya Johnson");
    await expect(page.getByLabel("Posts", { exact: true })).toContainText(
      "Planning a weekend photo walk downtown.",
    );
  });

  test("renders the empty feed state", async ({ context, page, baseURL }) => {
    await authenticate(context, baseURL!, "empty");

    await page.goto("/feed");

    await expect(page.getByRole("heading", { name: "No posts yet" })).toBeVisible();
    await expect(page.getByText("This placeholder is ready for the feed")).toBeVisible();
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

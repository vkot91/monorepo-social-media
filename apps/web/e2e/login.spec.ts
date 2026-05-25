import { expect, test } from "@playwright/test";
import { testPosts, testUsers } from "@social/database";

import { authenticate } from "./support/auth";
import { resetDatabase } from "./support/database";

test.describe("login page", () => {
  test.beforeEach(async () => {
    await resetDatabase();
  });

  test("renders the login form and registration link", async ({ page }) => {
    await page.goto("/login");

    await expect(page.getByRole("heading", { name: "Welcome back" })).toBeVisible();
    await expect(page.getByLabel("Email")).toBeVisible();
    await expect(page.getByLabel("Password")).toBeVisible();
    await expect(page.getByRole("button", { name: "Sign in" })).toBeVisible();
    await expect(page.getByRole("link", { name: "Create an account" })).toHaveAttribute("href", "/register");
  });

  test("shows client-side validation errors before submitting", async ({ page }) => {
    await page.goto("/login");
    await page.getByRole("button", { name: "Sign in" }).click();

    await expect(page.getByText(/invalid email/i)).toBeVisible();
    await expect(page.getByText(/8/)).toBeVisible();
  });

  test("shows backend authentication errors", async ({ page }) => {
    await page.goto("/login");

    await page.getByLabel("Email").fill(testUsers.login.email);
    await page.getByLabel("Password").fill("wrong-password");
    await page.getByRole("button", { name: "Sign in" }).click();

    const notifications = page.getByLabel("top right notifications");

    await expect(notifications.getByText("Sign in failed")).toBeVisible();
    await expect(notifications.getByText("Invalid email or password")).toBeVisible();
  });

  test("signs in and opens the feed", async ({ page }) => {
    await page.goto("/login");

    await page.getByLabel("Email").fill(testUsers.login.email);
    await page.getByLabel("Password").fill("password123");
    await page.getByRole("button", { name: "Sign in" }).click();

    await expect(page).toHaveURL(/\/feed$/);
    await expect(page.getByRole("heading", { name: "Your feed" })).toBeVisible();
    await expect(page.getByText(testPosts.mayaFeed.content)).toBeVisible();
  });

  test("redirects authenticated users to the feed", async ({ context, page, baseURL }) => {
    await authenticate(context, baseURL!, "posts");

    await page.goto("/login");

    await expect(page).toHaveURL(/\/feed$/);
    await expect(page.getByRole("heading", { name: "Your feed" })).toBeVisible();
  });
});

import { expect, test } from "@playwright/test";

import { authenticate } from "./support/auth";
import { resetDatabase } from "./support/database";

test.describe("register page", () => {
  test.beforeEach(async () => {
    await resetDatabase();
  });

  test("renders the registration form and login link", async ({ page }) => {
    await page.goto("/register");

    await expect(page.getByRole("heading", { name: "Create your account" })).toBeVisible();
    await expect(page.getByLabel("Display name")).toBeVisible();
    await expect(page.getByLabel("Username")).toBeVisible();
    await expect(page.getByLabel("Email")).toBeVisible();
    await expect(page.getByLabel("Password")).toBeVisible();
    await expect(page.getByRole("button", { name: "Create account" })).toBeVisible();
    await expect(page.getByRole("link", { name: "Sign in" })).toHaveAttribute("href", "/login");
  });

  test("shows client-side validation errors before submitting", async ({ page }) => {
    await page.goto("/register");
    await page.getByRole("button", { name: "Create account" }).click();

    await expect(page.getByText(/display name/i)).toBeVisible();
    await expect(page.getByText(/username/i)).toBeVisible();
    await expect(page.getByText(/invalid email/i)).toBeVisible();
    await expect(page.getByText(/8/)).toBeVisible();
  });

  test("shows backend registration errors", async ({ page }) => {
    await page.goto("/register");

    await page.getByLabel("Display name").fill("Maya Johnson");
    await page.getByLabel("Username").fill("maya");
    await page.getByLabel("Email").fill("taken@example.com");
    await page.getByLabel("Password").fill("password123");
    await page.getByRole("button", { name: "Create account" }).click();

    await expect(page.getByText("Email or username is already in use")).toBeVisible();
  });

  test("creates an account and opens the feed", async ({ page }) => {
    await page.goto("/register");

    await page.getByLabel("Display name").fill("New User");
    await page.getByLabel("Username").fill("new_user");
    await page.getByLabel("Email").fill("new-user@example.com");
    await page.getByLabel("Password").fill("password123");
    await page.getByRole("button", { name: "Create account" }).click();

    await expect(page).toHaveURL(/\/feed$/);
    await expect(page.getByRole("heading", { name: "Your feed" })).toBeVisible();
    await expect(page.getByRole("heading", { name: "No posts yet" })).toBeVisible();
  });

  test("redirects authenticated users to the feed", async ({ context, page, baseURL }) => {
    await authenticate(context, baseURL!, "posts");

    await page.goto("/register");

    await expect(page).toHaveURL(/\/feed$/);
    await expect(page.getByRole("heading", { name: "Your feed" })).toBeVisible();
  });
});

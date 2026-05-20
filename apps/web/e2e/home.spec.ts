import { expect, test } from "@playwright/test";

import { resetDatabase } from "./support/database";

test.describe("home page", () => {
  test.beforeEach(async () => {
    await resetDatabase();
  });

  test("renders the public landing page", async ({ page }) => {
    await page.goto("/");

    await expect(page.getByRole("heading", { name: "Share the day with people who matter." })).toBeVisible();
    await expect(page.getByText("A focused social feed for posts")).toBeVisible();
    await expect(page.getByLabel("Feed preview")).toContainText("Maya Johnson");
    await expect(page.getByLabel("Feed preview")).toContainText("Alex Chen");
  });

  test("links to login and registration", async ({ page }) => {
    await page.goto("/");

    await expect(page.getByRole("link", { name: "Create account" })).toHaveAttribute("href", "/register");
    await expect(page.getByRole("link", { name: "Sign in" })).toHaveAttribute("href", "/login");
  });
});

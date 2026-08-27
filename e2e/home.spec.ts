import { test, expect } from "@playwright/test";

test("home page shows Web Slide heading", async ({ page }) => {
  await page.goto("/");
  await expect(page.getByRole("heading", { name: "Web Slide" })).toBeVisible();
});

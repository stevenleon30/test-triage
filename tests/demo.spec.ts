import { test, expect } from "@playwright/test";

test("page title is correct", async ({ page }) => {
  await page.goto("https://example.com");
  await expect(page).toHaveTitle("Totally Wrong Title");
});

test("click the buy button", async ({ page }) => {
  await page.goto("https://example.com");
  await page.click("#buy-now-button", { timeout: 2000 });
});

test("load dashboard data", async () => {
  throw new Error("Timeout 5000ms exceeded while waiting for response from /api/data");
});

test("save to database", async () => {
  throw new Error("connect ECONNREFUSED 127.0.0.1:5432");
});

test("this one passes", async ({ page }) => {
  await page.goto("https://example.com");
  await expect(page).toHaveTitle("Example Domain");
});

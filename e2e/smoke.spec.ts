import { test, expect } from "@playwright/test";

const KEY_ROUTES = [
  "/dashboard",
  "/candidates",
  "/vehicles",
  "/exams",
  "/operations",
];

test("root redirects to /dashboard and renders a heading", async ({
  page,
}) => {
  await page.goto("/");
  await expect(page).toHaveURL(/\/dashboard$/);
  await expect(
    page.getByRole("heading", { level: 1 }).first(),
  ).toBeVisible();
});

test.describe("key routes mount with mock adapter", () => {
  for (const path of KEY_ROUTES) {
    test(`${path} renders a level-1 heading`, async ({ page }) => {
      await page.goto(path);
      await expect(page).toHaveURL(new RegExp(`${path}$`));
      await expect(
        page.getByRole("heading", { level: 1 }).first(),
      ).toBeVisible({ timeout: 5_000 });
    });
  }
});

test("sidebar navigation marks the active route via aria-current", async ({
  page,
}) => {
  await page.goto("/dashboard");
  const nav = page.getByRole("navigation", { name: /primary/i });
  await expect(nav).toBeVisible();

  // Dashboard is the active route on first load.
  await expect(
    nav.getByRole("link", { name: /^dashboard$/i }),
  ).toHaveAttribute("aria-current", "page");

  // Click to a different route — active state should follow.
  await nav.getByRole("link", { name: /^candidates$/i }).click();
  await expect(page).toHaveURL(/\/candidates$/);
  await expect(
    nav.getByRole("link", { name: /^candidates$/i }),
  ).toHaveAttribute("aria-current", "page");
  // Dashboard is no longer the active route.
  await expect(
    nav.getByRole("link", { name: /^dashboard$/i }),
  ).not.toHaveAttribute("aria-current", "page");
});

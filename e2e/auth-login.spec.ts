import { test, expect } from "@playwright/test";

const DESKTOP = { width: 1440, height: 900 } as const;

/**
 * `/login` lives outside the shell and renders regardless of session,
 * so it is reachable in the mock build. This smoke asserts the form
 * is present in the live/static build.
 */
test.describe("login screen (mock-mode baseline)", () => {
  test.use({ viewport: DESKTOP });

  test("/login renders the sign-in form", async ({ page }) => {
    await page.goto("/login");
    await expect(
      page.getByRole("heading", { level: 1, name: /sign in/i }),
    ).toBeVisible();
    await expect(page.getByLabel("Login")).toBeVisible();
    await expect(page.getByLabel("Password")).toBeVisible();
    await expect(
      page.getByRole("button", { name: /sign in/i }),
    ).toBeVisible();
  });
});

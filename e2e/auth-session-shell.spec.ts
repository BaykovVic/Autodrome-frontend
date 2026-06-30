import { test, expect } from "@playwright/test";

const DESKTOP = { width: 1440, height: 900 } as const;

/**
 * The e2e build runs with `NEXT_PUBLIC_MOCK_SCENARIO=normal`, so the
 * session shell resolves to an authenticated operator. These smokes
 * assert the gate is transparent in the authenticated path and that
 * the topbar operator cluster is bound to the session actor.
 */
test.describe("auth session shell (mock-mode baseline)", () => {
  test.use({ viewport: DESKTOP });

  test("authenticated session renders the shell content", async ({
    page,
  }) => {
    await page.goto("/dashboard");
    // Session gate is transparent: workspace heading is visible.
    await expect(
      page.getByRole("heading", { level: 1 }).first(),
    ).toBeVisible();
  });

  test("topbar operator cluster reflects the session actor", async ({
    page,
  }) => {
    await page.goto("/dashboard");
    const topbar = page.getByRole("banner", { name: /console topbar/i });
    await expect(topbar).toBeVisible();
    await expect(topbar.getByText("Anna Petrova")).toBeVisible();
    await expect(topbar.getByText("Administrator")).toBeVisible();
  });
});

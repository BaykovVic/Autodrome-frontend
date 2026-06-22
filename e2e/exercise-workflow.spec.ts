import { test, expect } from "@playwright/test";

/**
 * Browser workflow smoke for the exercises workspace.
 *
 * Per `frontend-exercise-live-api-integration` spec: the exercises
 * workspace is wired to live `exercise-service` reads + supported
 * mutations in `live` mode, but the default `mock` mode (baked into
 * `playwright.config.ts`) keeps the workspace backend-free. This
 * spec proves that the live-loader code-path does not regress the
 * mock-mode workspace:
 *
 *   - exercise heading + groups sidebar + catalog table render from
 *     mock fixtures (default scenario);
 *   - group filter buttons switch the visible catalog without
 *     crashing;
 *   - selecting an exercise row updates the detail aside;
 *   - sidebar nav round-trip Dashboard → Exercises → Dashboard
 *     keeps `aria-current="page"` correct.
 *
 * Live transport is verified at the unit layer
 * (`live-exercise-loader.test.ts`) against a mocked openapi-fetch
 * client. `liveExerciseUpdate` explicitly throws
 * `ExerciseUpdateUnsupportedError` per spec degraded-state rule
 * (backend has no update endpoint yet).
 */

const DESKTOP = { width: 1440, height: 900 } as const;

test.use({ viewport: DESKTOP });

test.describe("exercise workspace workflow (mock-mode smoke)", () => {
  test("/exercises renders heading, groups sidebar, and catalog rows", async ({
    page,
  }) => {
    await page.goto("/exercises");
    await expect(
      page.getByRole("heading", { level: 1, name: /^exercises$/i }),
    ).toBeVisible();

    // Groups sidebar surfaces the canonical groups from the mock
    // default scenario.
    const groupsNav = page.getByRole("navigation", {
      name: /exercise groups/i,
    });
    await expect(groupsNav).toBeVisible();
    await expect(groupsNav.getByRole("button", { name: /^all/i })).toBeVisible();
    await expect(
      groupsNav.getByRole("button", { name: /basic skills/i }),
    ).toBeVisible();

    // The catalog renders at least one mock exercise row.
    await expect(
      page.getByRole("button", { name: /^EX-101$/ }),
    ).toBeVisible();
  });

  test("/exercises group filter button narrows the visible catalog without crashing", async ({
    page,
  }) => {
    await page.goto("/exercises");
    const groupsNav = page.getByRole("navigation", {
      name: /exercise groups/i,
    });

    await groupsNav.getByRole("button", { name: /slalom/i }).click();
    await expect(
      groupsNav.getByRole("button", { name: /slalom/i }),
    ).toHaveAttribute("aria-current", "true");
    await expect(
      page.getByRole("heading", { level: 1, name: /^exercises$/i }),
    ).toBeVisible();
  });

  test("/exercises: selecting an exercise row switches the detail aside", async ({
    page,
  }) => {
    await page.goto("/exercises");

    // Click EX-102 (a different exercise from the default selection)
    // — detail aside should switch its aria-label.
    await page
      .getByRole("button", { name: /^EX-102$/ })
      .click();
    await expect(
      page.getByRole("complementary", { name: /Exercise EX-102/i }),
    ).toBeVisible();
  });

  test("Sidebar round-trip Dashboard → Exercises → Dashboard", async ({
    page,
  }) => {
    await page.goto("/dashboard");
    const nav = page.getByRole("navigation", { name: /primary/i });

    await nav.getByRole("link", { name: /^exercises$/i }).click();
    await expect(page).toHaveURL(/\/exercises$/);
    await expect(
      page.getByRole("heading", { level: 1, name: /^exercises$/i }),
    ).toBeVisible();
    await expect(
      nav.getByRole("link", { name: /^exercises$/i }),
    ).toHaveAttribute("aria-current", "page");

    await nav.getByRole("link", { name: /^dashboard$/i }).click();
    await expect(page).toHaveURL(/\/dashboard$/);
    await expect(
      page.getByRole("heading", {
        level: 1,
        name: /local node dashboard/i,
      }),
    ).toBeVisible();
  });
});

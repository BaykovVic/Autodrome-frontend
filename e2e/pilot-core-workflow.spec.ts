import { test, expect } from "@playwright/test";

/**
 * Pilot-level browser E2E linking candidate → vehicle →
 * exam happy path. Mock-deterministic; live opt-in via
 * `NEXT_PUBLIC_API_ADAPTER=live pnpm e2e`.
 *
 * Pilot lens (vs the per-workspace specs): asserts что
 * operator может пройти end-to-end pilot rollout без
 * выпадения из shell — каждый workspace доступен в
 * предсказуемом порядке, breadcrumb/heading remain
 * stable, никаких dead-end navigations.
 *
 * Expected degraded states (when backend unavailable):
 * adapter мок-режима по-прежнему рендерит fixtures —
 * pilot e2e не падает от live backend gaps.
 */

const DESKTOP = { width: 1440, height: 900 } as const;

test.describe("pilot core workflow (candidate → vehicle → exam)", () => {
  test.use({ viewport: DESKTOP });

  test("step 1: candidate registration page reachable from list", async ({
    page,
  }) => {
    await page.goto("/candidates");
    await expect(
      page.getByRole("heading", { level: 1, name: /candidates/i }),
    ).toBeVisible();
    await page.goto("/candidates/new");
    await expect(
      page.getByRole("heading", { level: 1, name: /create candidate/i }),
    ).toBeVisible();
    await expect(
      page.getByRole("form", { name: /candidate data/i }),
    ).toBeVisible();
  });

  test("step 2: vehicle registry reachable", async ({ page }) => {
    await page.goto("/vehicles");
    await expect(
      page.getByRole("heading", { level: 1, name: /vehicles/i }),
    ).toBeVisible();
    await expect(
      page.getByRole("region", { name: /vehicles registry/i }),
    ).toBeVisible();
  });

  test("step 3: exam workspace reachable + state filter", async ({
    page,
  }) => {
    await page.goto("/exams");
    await expect(
      page.getByRole("heading", { level: 1, name: /exams/i }),
    ).toBeVisible();
    await expect(
      page.getByRole("tablist", { name: /exam state filter/i }),
    ).toBeVisible();
  });

  test("linked pilot path: candidate registration → vehicle registry → exam workspace without dead ends", async ({
    page,
  }) => {
    // Stage 1 — candidate page.
    await page.goto("/candidates/new");
    await expect(
      page.getByRole("heading", { level: 1, name: /create candidate/i }),
    ).toBeVisible();

    // Stage 2 — vehicles workspace via sidebar.
    await page
      .getByRole("link", { name: /^vehicles$/i })
      .first()
      .click();
    await expect(page).toHaveURL(/\/vehicles$/);
    await expect(
      page.getByRole("heading", { level: 1, name: /vehicles/i }),
    ).toBeVisible();

    // Stage 3 — exams workspace via sidebar.
    await page
      .getByRole("link", { name: /^exams$/i })
      .first()
      .click();
    await expect(page).toHaveURL(/\/exams$/);
    await expect(
      page.getByRole("heading", { level: 1, name: /exams/i }),
    ).toBeVisible();

    // Stage 4 — dashboard back-link works (no dead end).
    await page
      .getByRole("link", { name: /^dashboard$/i })
      .first()
      .click();
    await expect(page).toHaveURL(/\/dashboard$/);
  });
});

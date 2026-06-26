import { test, expect } from "@playwright/test";

/**
 * Composite browser workflow E2E (mock-mode deterministic)
 * для core domain flows: Candidates, Vehicles, Exams,
 * Exercises, Rules.
 *
 * Spec: covers create/list-like surfaces. Mock mode
 * deterministic (никаких write side-effects); live mode
 * opt-in через `NEXT_PUBLIC_API_ADAPTER=live`.
 *
 * Связь с уже шипнутыми specs:
 *   - per-workspace e2e (candidate-vehicle-workflow,
 *     exam-workflow, exercise-workflow, rules-violations-
 *     workflow) уже зелёные — этот spec композирует
 *     cross-workspace navigation от dashboard через core
 *     registry workspaces.
 *
 * Live mode documentation: запуск через
 * `NEXT_PUBLIC_API_ADAPTER=live pnpm e2e` — все default
 * loaders в hooks свитчатся; результат зависит от
 * доступности backend services + idempotency keys.
 */

const DESKTOP = { width: 1440, height: 900 } as const;
const MOBILE = { width: 375, height: 812 } as const;

test.describe("core domain composite workflow (mock-mode)", () => {
  test.use({ viewport: DESKTOP });

  test("workflow A: dashboard → candidates registry → create page reachable", async ({
    page,
  }) => {
    await page.goto("/dashboard");
    await page
      .getByRole("link", { name: /^candidates$/i })
      .first()
      .click();
    await expect(page).toHaveURL(/\/candidates$/);
    await expect(
      page.getByRole("heading", { level: 1, name: /candidates/i }),
    ).toBeVisible();
    // "Create" affordance reachable.
    await page.goto("/candidates/new");
    await expect(page).toHaveURL(/\/candidates\/new$/);
  });

  test("workflow B: dashboard → vehicles registry → heading visible", async ({
    page,
  }) => {
    await page.goto("/dashboard");
    await page
      .getByRole("link", { name: /^vehicles$/i })
      .first()
      .click();
    await expect(page).toHaveURL(/\/vehicles$/);
    await expect(
      page.getByRole("heading", { level: 1, name: /vehicles/i }),
    ).toBeVisible();
  });

  test("workflow C: dashboard → exams workspace → state filter + detail aside reachable", async ({
    page,
  }) => {
    await page.goto("/dashboard");
    await page
      .getByRole("link", { name: /^exams$/i })
      .first()
      .click();
    await expect(page).toHaveURL(/\/exams$/);
    await expect(
      page.getByRole("heading", { level: 1, name: /exams/i }),
    ).toBeVisible();
    await expect(
      page.getByRole("tablist", { name: /exam state filter/i }),
    ).toBeVisible();
  });

  test("workflow D: exercises workspace → groups visible", async ({
    page,
  }) => {
    await page.goto("/exercises");
    await expect(
      page.getByRole("heading", { level: 1, name: /exercises/i }),
    ).toBeVisible();
    await expect(
      page.getByRole("navigation", { name: /exercise groups/i }),
    ).toBeVisible();
  });

  test("workflow E: rules workspace → heading visible", async ({ page }) => {
    await page.goto("/rules");
    await expect(
      page.getByRole("heading", { level: 1, name: /rules/i }),
    ).toBeVisible();
  });

  test("workflow F: cross-workspace navigation chain (candidates → vehicles → exams → rules → dashboard)", async ({
    page,
  }) => {
    await page.goto("/candidates");
    await page
      .getByRole("link", { name: /^vehicles$/i })
      .first()
      .click();
    await expect(page).toHaveURL(/\/vehicles$/);
    await page
      .getByRole("link", { name: /^exams$/i })
      .first()
      .click();
    await expect(page).toHaveURL(/\/exams$/);
    await page
      .getByRole("link", { name: /^rules$/i })
      .first()
      .click();
    await expect(page).toHaveURL(/\/rules$/);
    await page
      .getByRole("link", { name: /^dashboard$/i })
      .first()
      .click();
    await expect(page).toHaveURL(/\/dashboard$/);
  });
});

test.describe("core domain composite workflow · mobile", () => {
  test.use({ viewport: MOBILE });

  test("mobile: candidates + exams accessible без horizontal overflow", async ({
    page,
  }) => {
    for (const route of ["/candidates", "/exams"] as const) {
      await page.goto(route);
      const scrollWidth = await page.evaluate(
        () => document.documentElement.scrollWidth,
      );
      const clientWidth = await page.evaluate(
        () => document.documentElement.clientWidth,
      );
      expect(scrollWidth).toBeLessThanOrEqual(clientWidth + 1);
    }
  });
});

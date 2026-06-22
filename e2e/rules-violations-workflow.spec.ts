import { test, expect } from "@playwright/test";

/**
 * Browser workflow smoke for the rules + violations workspaces.
 *
 * Per `frontend-violation-rule-live-api-integration` spec: the
 * `/rules` and `/violations` workspaces are wired to live
 * `violation-rule-service` reads + supported create/publish
 * mutations in `live` mode, but the default `mock` mode (baked
 * into `playwright.config.ts`) keeps the workspaces backend-free.
 * This spec proves that the live-loader code-path does not regress
 * the mock-mode workspaces:
 *
 *   - `/rules` renders heading + table rows + detail aside from
 *     mock fixtures (default scenario);
 *   - selecting a rule row updates the detail aside;
 *   - `/violations` renders heading + severity legend + table
 *     rows + active-rule banner;
 *   - selecting a violation row updates the detail aside;
 *   - sidebar nav round-trip Dashboard → Rules → Violations →
 *     Dashboard works.
 *
 * Live transport is verified at the unit layer
 * (`live-rules-loader.test.ts`, `live-violations-loader.test.ts`)
 * against a mocked openapi-fetch client. `liveRuleUpdate` throws
 * `RuleUpdateUnsupportedError` (backend has no edit endpoint yet),
 * matching the spec degraded-state rule. Editor dirty-state
 * preservation is currently vacuous: `RulesScreen` is a read-only
 * preview ("EDITOR · PLANNED"), so this smoke only covers the
 * read-side live integration, as also noted in the report.
 */

const DESKTOP = { width: 1440, height: 900 } as const;

test.use({ viewport: DESKTOP });

test.describe("rules + violations workflow (mock-mode smoke)", () => {
  test("/rules renders heading, table rows, and detail aside", async ({
    page,
  }) => {
    await page.goto("/rules");
    await expect(
      page.getByRole("heading", { level: 1, name: /^rules$/i }),
    ).toBeVisible();

    // Mock default scenario seeds at least RULE-014 / RULE-013.
    const ruleRow = page
      .getByRole("button", { name: /RULE-014/ })
      .first();
    await expect(ruleRow).toBeVisible();

    // The detail aside is rendered for the default selection (first
    // rule), so check that the aria-label matches a known rule id.
    await expect(
      page.getByRole("complementary", { name: /Rule RULE-/i }),
    ).toBeVisible();
  });

  test("/rules: selecting a different rule switches the detail aside", async ({
    page,
  }) => {
    await page.goto("/rules");

    await page
      .getByRole("button", { name: /RULE-013/ })
      .first()
      .click();
    await expect(
      page.getByRole("complementary", { name: /Rule RULE-013/i }),
    ).toBeVisible();
  });

  test("/violations renders heading, severity legend, and rows", async ({
    page,
  }) => {
    await page.goto("/violations");
    await expect(
      page.getByRole("heading", { level: 1, name: /violations catalog/i }),
    ).toBeVisible();

    // Severity legend is mounted (per design).
    await expect(
      page.getByLabel(/severity legend/i),
    ).toBeVisible();

    // Mock default scenario seeds at least VIO-101 / VIO-102.
    await expect(
      page.getByRole("button", { name: /VIO-101/ }).first(),
    ).toBeVisible();
  });

  test("/violations: selecting a row switches the detail aside", async ({
    page,
  }) => {
    await page.goto("/violations");

    await page
      .getByRole("button", { name: /VIO-102/ })
      .first()
      .click();
    await expect(
      page.getByRole("complementary", { name: /Violation VIO-102/i }),
    ).toBeVisible();
  });

  test("Sidebar round-trip Dashboard → Rules → Violations → Dashboard", async ({
    page,
  }) => {
    await page.goto("/dashboard");
    const nav = page.getByRole("navigation", { name: /primary/i });

    await nav.getByRole("link", { name: /^rules$/i }).click();
    await expect(page).toHaveURL(/\/rules$/);
    await expect(
      page.getByRole("heading", { level: 1, name: /^rules$/i }),
    ).toBeVisible();
    await expect(
      nav.getByRole("link", { name: /^rules$/i }),
    ).toHaveAttribute("aria-current", "page");

    await nav.getByRole("link", { name: /^violations$/i }).click();
    await expect(page).toHaveURL(/\/violations$/);
    await expect(
      page.getByRole("heading", { level: 1, name: /violations catalog/i }),
    ).toBeVisible();
    await expect(
      nav.getByRole("link", { name: /^violations$/i }),
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

import { test, expect } from "@playwright/test";

/**
 * Browser workflow smoke for the exams workspace.
 *
 * Per `frontend-exam-live-api-integration` spec: the exams workspace
 * is wired to live exam-service lifecycle commands in `live` mode,
 * but the default `mock` mode (baked into `playwright.config.ts`)
 * keeps the workspace backend-free. This spec proves that the
 * live-loader code-path does not regress the mock-mode workspace:
 *
 *   - exam table renders from mock fixtures (default scenario);
 *   - state-filter tabs (All / In progress / Scheduled / Finished /
 *     Aborted) switch without crashing the page;
 *   - selecting an exam row updates the detail aside;
 *   - sidebar nav round-trip Dashboard → Exams → Dashboard works.
 *
 * Live transport is verified at the unit layer
 * (`live-exam-loader.test.ts`) against a mocked openapi-fetch
 * client.
 */

const DESKTOP = { width: 1440, height: 900 } as const;

test.use({ viewport: DESKTOP });

test.describe("exam workspace workflow (mock-mode smoke)", () => {
  test("/exams renders heading, exam rows, and primary CTA", async ({
    page,
  }) => {
    await page.goto("/exams");
    await expect(
      page.getByRole("heading", { level: 1, name: /^exams$/i }),
    ).toBeVisible();

    // Mock default scenario seeds at least one exam (EXM-0118).
    const firstExamButton = page
      .getByRole("button", { name: /EXM-0118/i })
      .first();
    await expect(firstExamButton).toBeVisible();

    // The Create-exam CTA is rendered (disabled until follow-up
    // feature wires the form); checked via accessible name.
    await expect(
      page.getByRole("button", { name: /create exam/i }),
    ).toBeVisible();
  });

  test("/exams state-filter tabs switch without surfacing a fatal error", async ({
    page,
  }) => {
    await page.goto("/exams");
    const allTab = page.getByRole("tab", { name: /^all$/i });
    const inProgressTab = page.getByRole("tab", { name: /^in progress$/i });
    const finishedTab = page.getByRole("tab", { name: /^finished$/i });
    await expect(allTab).toBeVisible();
    await expect(inProgressTab).toBeVisible();
    await expect(finishedTab).toBeVisible();

    await inProgressTab.click();
    await expect(inProgressTab).toHaveAttribute("aria-selected", "true");
    await expect(
      page.getByRole("heading", { level: 1, name: /^exams$/i }),
    ).toBeVisible();

    await finishedTab.click();
    await expect(finishedTab).toHaveAttribute("aria-selected", "true");
    await expect(
      page.getByRole("heading", { level: 1, name: /^exams$/i }),
    ).toBeVisible();
  });

  test("/exams: selecting a row switches the detail aside", async ({
    page,
  }) => {
    await page.goto("/exams");

    // Click on EXM-0117 (a different exam from the default
    // selection) — detail aside should switch its aria-label.
    await page
      .getByRole("button", { name: /EXM-0117/i })
      .first()
      .click();
    await expect(
      page.getByRole("complementary", { name: /Exam EXM-0117/i }),
    ).toBeVisible();
  });

  test("Sidebar round-trip Dashboard → Exams → Dashboard", async ({
    page,
  }) => {
    await page.goto("/dashboard");
    const nav = page.getByRole("navigation", { name: /primary/i });

    await nav.getByRole("link", { name: /^exams$/i }).click();
    await expect(page).toHaveURL(/\/exams$/);
    await expect(
      page.getByRole("heading", { level: 1, name: /^exams$/i }),
    ).toBeVisible();
    await expect(
      nav.getByRole("link", { name: /^exams$/i }),
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

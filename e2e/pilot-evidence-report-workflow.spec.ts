import { test, expect } from "@playwright/test";

/**
 * Pilot-level browser E2E для evidence / report flow.
 *
 * Pilot lens (vs `evidence-reporting-workflow.spec.ts`):
 * фокусируется на end-to-end happy path операторской
 * pilot rollout — открыть evidence list, открыть detail,
 * проверить media unavailable + report degraded surface,
 * перейти в reporting catalog без потери контекста.
 *
 * Полные unit-tests + degraded-state taxonomy
 * coverage остаются в Track 4 F5
 * (`evidence-reporting-workflow.spec.ts`). Этот spec
 * валидирует pilot rollout user journey.
 */

const DESKTOP = { width: 1440, height: 900 } as const;

test.describe("pilot evidence + report workflow", () => {
  test.use({ viewport: DESKTOP });

  test("pilot happy path: list → sealed evidence detail → media metadata available + reporting catalog reachable", async ({
    page,
  }) => {
    await page.goto("/evidence");
    await page
      .getByRole("link", { name: /open evidence detail →/i })
      .first()
      .click();
    await expect(page).toHaveURL(/\/evidence\/EVD-/);
    await expect(
      page.getByText(/\(recordingMetadataAvailable\)/i).first(),
    ).toBeVisible();
    await page
      .getByRole("link", { name: /^reporting$/i })
      .first()
      .click();
    await expect(page).toHaveURL(/\/reporting$/);
    await expect(
      page.getByRole("table", { name: /reporting template catalog/i }),
    ).toBeVisible();
  });

  test("pilot degraded path: failed evidence surfaces retentionChecksumIssue + disabled report submission", async ({
    page,
  }) => {
    await page.goto("/evidence/EVD-77204");
    await expect(
      page.getByText(/\(retentionChecksumIssue\)/i).first(),
    ).toBeVisible();
    await expect(
      page.getByRole("button", { name: /playback/i }),
    ).toBeDisabled();
    await page
      .getByRole("link", { name: /^reporting$/i })
      .first()
      .click();
    await expect(
      page.getByRole("button", { name: /generate report/i }),
    ).toBeDisabled();
  });

  test("pilot media unavailable path: active recording → manifestUnavailable pill", async ({
    page,
  }) => {
    await page.goto("/evidence/EVD-77212");
    await expect(
      page.getByText(/\(manifestUnavailable\)/i).first(),
    ).toBeVisible();
  });
});

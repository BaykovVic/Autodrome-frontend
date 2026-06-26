import { test, expect } from "@playwright/test";

/**
 * Pilot-level browser E2E для operations / deploy
 * workflows.
 *
 * Pilot lens (vs `operations-workflow.spec.ts`): валидирует
 * end-to-end operator pilot rollout — health dashboard →
 * diagnostics → backups → logs hand-off, без destructive
 * actions.
 *
 * Track 5 / F1-F3 (canonical health / diagnostics / backup
 * APIs) blocked — этот spec проверяет, что operations
 * workspace продолжает работать в degraded mock-first
 * mode без обмана operator.
 */

const DESKTOP = { width: 1440, height: 900 } as const;

test.describe("pilot operations + deploy workflow", () => {
  test.use({ viewport: DESKTOP });

  test("pilot path: operations tabs reachable in order (health → diagnostics → backups → logs)", async ({
    page,
  }) => {
    await page.goto("/operations");
    // Health (default tab).
    await expect(
      page.getByRole("region", { name: /service health dashboard/i }),
    ).toBeVisible();

    // Diagnostics — runtime + endpoints visible.
    await page.getByRole("tab", { name: /^diagnostics$/i }).click();
    await expect(
      page.getByRole("region", { name: /diagnostics overview/i }),
    ).toBeVisible();
    await expect(
      page.getByRole("region", {
        name: /service endpoint diagnostics/i,
      }),
    ).toBeVisible();

    // Backups — reachable, no destructive click.
    await page.getByRole("tab", { name: /^backups$/i }).click();
    await expect(
      page.getByRole("region", { name: /backups overview/i }),
    ).toBeVisible();

    // Logs / export hand-off.
    await page.getByRole("tab", { name: /^logs$/i }).click();
    await expect(
      page.getByRole("region", { name: /logs and export/i }),
    ).toBeVisible();
  });

  test("pilot safety: no destructive backup actions executed automatically", async ({
    page,
  }) => {
    await page.goto("/operations");
    await page.getByRole("tab", { name: /^backups$/i }).click();
    // Backups region present but spec NEVER clicks
    // destructive backup/restore buttons. Этот test
    // документирует safety constraint в коде.
    await expect(
      page.getByRole("region", { name: /backups overview/i }),
    ).toBeVisible();
  });
});

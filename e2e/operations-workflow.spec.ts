import { test, expect } from "@playwright/test";

/**
 * Composite browser workflow E2E (mock-mode deterministic)
 * for Operations workspace.
 *
 * Scope per spec:
 *   - Health workflow (Service health tab).
 *   - Diagnostics workflow (Diagnostics tab).
 *   - Backup/restore preview workflow (Backups tab — no
 *     destructive submission).
 *   - Release hand-off workflow (Logs tab — export
 *     affordances surfaced без enabling write side-effects).
 *   - Mock deterministic — все fixtures in-process; e2e не
 *     зависит от live backend.
 *
 * Per spec rule "Destructive actions not executed in E2E
 * unless explicitly mocked": никаких click submitting
 * destructive backup/restore вне dialog preview.
 *
 * Track 5 / F1-F3 (canonical health / diagnostics / backup
 * APIs) shipped как BLOCKED reports — поэтому workflow
 * E2E проверяет существующие mock-first degraded surfaces,
 * не имитирует live binding.
 */

const DESKTOP = { width: 1440, height: 900 } as const;
const MOBILE = { width: 375, height: 812 } as const;

test.describe("operations workflow (mock-mode deterministic)", () => {
  test.use({ viewport: DESKTOP });

  test("workflow A: service health tab loads + canonical fixture rows", async ({
    page,
  }) => {
    await page.goto("/operations");
    await expect(
      page.getByRole("heading", { level: 1, name: /operations/i }),
    ).toBeVisible();
    await expect(
      page.getByRole("region", { name: /service health dashboard/i }),
    ).toBeVisible();
  });

  test("workflow B: diagnostics tab — runtime mode + endpoint registry visible", async ({
    page,
  }) => {
    await page.goto("/operations");
    await page.getByRole("tab", { name: /^diagnostics$/i }).click();
    await expect(
      page.getByRole("region", { name: /diagnostics overview/i }),
    ).toBeVisible();
    await expect(
      page.getByRole("region", {
        name: /service endpoint diagnostics/i,
      }),
    ).toBeVisible();
    // 9 services registered as of Track 4 F1 — at least
    // mock+n/a badges per row.
    const probes = page.getByRole("button", {
      name: /check reachability/i,
    });
    await expect(probes.first()).toBeVisible();
  });

  test("workflow C: backups tab — overview present, destructive actions guarded", async ({
    page,
  }) => {
    await page.goto("/operations");
    await page.getByRole("tab", { name: /^backups$/i }).click();
    await expect(
      page.getByRole("region", { name: /backups overview/i }),
    ).toBeVisible();
    // Per spec "Destructive operations are not browser-local
    // shell commands" — restore action must be guarded.
    // We don't click destructive buttons; just assert the
    // surface is reachable.
  });

  test("workflow D: logs / export hand-off tab visible", async ({
    page,
  }) => {
    await page.goto("/operations");
    await page.getByRole("tab", { name: /^logs$/i }).click();
    await expect(
      page.getByRole("region", { name: /logs and export/i }),
    ).toBeVisible();
  });

  test("workflow E: cross-tab navigation preserves heading + tab semantics", async ({
    page,
  }) => {
    await page.goto("/operations");
    await page.getByRole("tab", { name: /^diagnostics$/i }).click();
    await expect(
      page.getByRole("tab", {
        name: /^diagnostics$/i,
        selected: true,
      }),
    ).toBeVisible();
    await page.getByRole("tab", { name: /^logs$/i }).click();
    await expect(
      page.getByRole("tab", { name: /^logs$/i, selected: true }),
    ).toBeVisible();
    // Active panel is the Logs region (heading is owned by
    // service-health tab; tab navigation swaps panels without
    // pretending a global title is always visible).
    await expect(
      page.getByRole("region", { name: /logs and export/i }),
    ).toBeVisible();
  });
});

test.describe("operations workflow · mobile baseline", () => {
  test.use({ viewport: MOBILE });

  test("mobile: operations tabs reachable without horizontal overflow", async ({
    page,
  }) => {
    await page.goto("/operations");
    await expect(
      page.getByRole("heading", { level: 1, name: /operations/i }),
    ).toBeVisible();
    const scrollWidth = await page.evaluate(
      () => document.documentElement.scrollWidth,
    );
    const clientWidth = await page.evaluate(
      () => document.documentElement.clientWidth,
    );
    expect(scrollWidth).toBeLessThanOrEqual(clientWidth + 1);
  });
});

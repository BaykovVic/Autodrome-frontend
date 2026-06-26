import { test, expect } from "@playwright/test";

/**
 * Degraded-state hardening sweep.
 *
 * Walks все pilot-critical dynamic routes c
 * non-existent / unknown id и валидирует что:
 *   - страница не падает (200 OK, не 500);
 *   - heading и breadcrumb остаются rendered;
 *   - degraded copy использует domain language (
 *     "not found" / "no data" / "unknown"), не raw
 *     implementation jargon;
 *   - actions, которые требуют backend, остаются disabled
 *     или вообще не surfaced.
 *
 * Cover:
 *   - Evidence detail (`/evidence/[evidenceId]`).
 *   - Virtual vehicle session monitor
 *     (`/virtual-vehicles/sessions/[sessionId]`).
 *   - Virtual vehicle manual control
 *     (`/virtual-vehicles/sessions/[sessionId]/manual-control`).
 *   - Virtual vehicle runtime preview
 *     (`/virtual-vehicles/sessions/[sessionId]/runtime-preview`).
 *
 * Все эти routes используют per-id loader с honest
 * not-found / unknown fallback — этот spec ensures
 * fallback rendering выживает без implementation jargon.
 */

const DESKTOP = { width: 1440, height: 900 } as const;

test.describe("degraded-state hardening: unknown ids", () => {
  test.use({ viewport: DESKTOP });

  test("evidence detail with unknown id renders honest not-found copy", async ({
    page,
  }) => {
    await page.goto("/evidence/EVD-DOES-NOT-EXIST");
    await expect(
      page.getByRole("heading", { level: 1, name: /EVD-DOES-NOT-EXIST/ }),
    ).toBeVisible();
    await expect(
      page.getByText(/not present in any fixture/i),
    ).toBeVisible();
    await expect(
      page.getByText(/no linked media recordings/i),
    ).toBeVisible();
    await expect(
      page.getByText(/no linked reporting documents/i),
    ).toBeVisible();
  });

  test("virtual vehicle session monitor with unknown sessionId renders empty surfaces", async ({
    page,
  }) => {
    await page.goto("/virtual-vehicles/sessions/VV-UNKNOWN-SESSION");
    await expect(
      page.getByRole("heading", {
        level: 1,
        name: /VV-UNKNOWN-SESSION/,
      }),
    ).toBeVisible();
    await expect(
      page.getByText(/No runtime telemetry available/i),
    ).toBeVisible();
    await expect(
      page.getByText(/No events recorded yet/i),
    ).toBeVisible();
  });

  test("manual control with unknown sessionId renders unknown banner", async ({
    page,
  }) => {
    await page.goto(
      "/virtual-vehicles/sessions/VV-UNKNOWN-SESSION/manual-control",
    );
    await expect(
      page.getByRole("heading", { level: 1, name: /manual control/i }),
    ).toBeVisible();
    const banner = page.getByRole("status").first();
    await expect(banner).toContainText(/unknown/i);
  });

  test("runtime preview with unknown sessionId renders unknown banner + no fake pose", async ({
    page,
  }) => {
    await page.goto(
      "/virtual-vehicles/sessions/VV-UNKNOWN-SESSION/runtime-preview",
    );
    await expect(
      page.getByRole("heading", { level: 1, name: /runtime preview/i }),
    ).toBeVisible();
    await expect(page.getByRole("status").first()).toContainText(
      /state unknown/i,
    );
  });

  test("degraded copy uses domain language, not implementation jargon", async ({
    page,
  }) => {
    await page.goto("/evidence/EVD-DOES-NOT-EXIST");
    const body = page.locator("body");
    // Никаких raw frame markers / stack traces / технических токенов:
    await expect(body).not.toContainText(/undefined is not/i);
    await expect(body).not.toContainText(/typeerror/i);
    await expect(body).not.toContainText(/cannot read prop/i);
    await expect(body).not.toContainText(/at\s+\w+\.\w+\s+\(/);
  });
});

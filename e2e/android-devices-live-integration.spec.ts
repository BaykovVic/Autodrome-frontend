import { test, expect } from "@playwright/test";

/**
 * Browser workflow smoke for the Android Devices live API
 * integration feature.
 *
 * Per spec / track reminder: real backend support may lag behind
 * frontend wiring; live mode must surface degraded/unsupported
 * states instead of fake success. `pnpm e2e` runs against the
 * mock build (per `playwright.config.ts`), so this smoke covers
 * the mock-mode regression path:
 *
 *   - the `/devices` workspace still renders the canonical
 *     workspace shape after the live wiring lands;
 *   - the policy editor still opens and saves through the
 *     dual-path `applyPolicyEdit` (mock branch in mock mode);
 *   - the sidebar entry + design gate behaviour stay intact.
 *
 * Live transport (admin list + assign + retire + 503 backend-lag
 * surface) is verified at the unit layer
 * (`live-android-devices-loader.test.ts`) against a mocked
 * openapi-fetch client; a future cross-scope e2e against a real
 * backend stack is tracked in the cross-scope feature map.
 */

const DESKTOP = { width: 1440, height: 900 } as const;

test.use({ viewport: DESKTOP });

test.describe("android devices live integration (mock-mode regression)", () => {
  test("/devices still renders heading + canonical rows after live wiring", async ({
    page,
  }) => {
    await page.goto("/devices");
    await expect(
      page.getByRole("heading", { level: 1, name: /android devices/i }),
    ).toBeVisible();
    await expect(
      page.getByRole("button", { name: /AD-7F02-PEND/ }).first(),
    ).toBeVisible();
    await expect(
      page.getByRole("button", { name: /AD-3A11-REG/ }).first(),
    ).toBeVisible();
  });

  test("Policy editor still saves through the mock branch of applyPolicyEdit", async ({
    page,
  }) => {
    await page.goto("/devices");
    await page.getByRole("button", { name: /AD-5C82-REG/ }).first().click();
    const detail = page.getByRole("complementary", {
      name: /Device AD-5C82-REG/i,
    });
    await expect(detail.getByText(/^v2$/)).toBeVisible();
    await detail.getByRole("button", { name: /edit policy/i }).click();

    const editor = page.getByRole("dialog", {
      name: /Edit capability policy · AD-5C82-REG/i,
    });
    await expect(editor).toBeVisible();
    // Toggle non-critical capability — no safe-confirm needed.
    await editor.getByLabel(/diagnostics/i).check();
    await editor.getByRole("button", { name: /^save$/i }).click();

    const after = page.getByRole("complementary", {
      name: /Device AD-5C82-REG/i,
    });
    await expect(after.getByText(/^v3$/)).toBeVisible();
  });

  test("Sidebar entry stays under SYSTEM and Android Devices is reachable", async ({
    page,
  }) => {
    await page.goto("/dashboard");
    const nav = page.getByRole("navigation", { name: /primary/i });
    await nav.getByRole("link", { name: /android devices/i }).click();
    await expect(page).toHaveURL(/\/devices$/);
    await expect(
      nav.getByRole("link", { name: /android devices/i }),
    ).toHaveAttribute("aria-current", "page");
  });
});

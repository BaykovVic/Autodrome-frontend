import { test, expect } from "@playwright/test";

/**
 * Browser workflow smoke for the Virtual Vehicles workspace
 * (mock-first baseline).
 *
 * Per `frontend-virtual-vehicle-workspace-baseline` spec: the
 * `/virtual-vehicles` workspace is mock-first. Live wiring lands
 * in Track 3 conditional on canonical OpenAPI. This smoke covers
 * the mock-mode behaviour operators see on the default `pnpm e2e`
 * build (mock + normal scenario).
 *
 * Coverage:
 *
 *   - heading + status tabs + canonical rows visible;
 *   - canonical source tokens (`simulator`, `legacyReplay`,
 *     `operatorManual`) rendered alongside operator-friendly
 *     labels;
 *   - Running filter narrows visible rows;
 *   - row click switches detail aside;
 *   - sidebar navigation Dashboard → Virtual Vehicles →
 *     Dashboard works.
 */

const DESKTOP = { width: 1440, height: 900 } as const;

test.use({ viewport: DESKTOP });

test.describe("virtual vehicles workspace (mock-mode baseline)", () => {
  test("/virtual-vehicles renders heading + status tabs + canonical rows", async ({
    page,
  }) => {
    await page.goto("/virtual-vehicles");
    await expect(
      page.getByRole("heading", { level: 1, name: /virtual vehicles/i }),
    ).toBeVisible();
    await expect(page.getByRole("tab", { name: /^all$/i })).toBeVisible();
    await expect(
      page.getByRole("tab", { name: /^running$/i }),
    ).toBeVisible();
    await expect(
      page.getByRole("tab", { name: /^idle$/i }),
    ).toBeVisible();

    await expect(
      page.getByRole("button", { name: /VV-SIM-001/ }).first(),
    ).toBeVisible();
    await expect(
      page.getByRole("button", { name: /VV-REPLAY-014/ }).first(),
    ).toBeVisible();
    await expect(
      page.getByRole("button", { name: /VV-MANUAL-LIVE-3/ }).first(),
    ).toBeVisible();
  });

  test("canonical source tokens visible alongside operator labels", async ({
    page,
  }) => {
    await page.goto("/virtual-vehicles");
    // Mono chips with canonical tokens are rendered for each row.
    await expect(
      page.getByText("(simulator)").first(),
    ).toBeVisible();
    await expect(
      page.getByText("(legacyReplay)").first(),
    ).toBeVisible();
    await expect(
      page.getByText("(operatorManual)").first(),
    ).toBeVisible();
  });

  test("Running filter narrows visible rows", async ({ page }) => {
    await page.goto("/virtual-vehicles");
    await page.getByRole("tab", { name: /^running$/i }).click();
    await expect(
      page.getByRole("tab", { name: /^running$/i }),
    ).toHaveAttribute("aria-selected", "true");
    await expect(
      page.getByRole("button", { name: /VV-SIM-001/ }).first(),
    ).toBeVisible();
    // Idle row VV-SIM-002 filtered out.
    await expect(
      page.getByRole("button", { name: /VV-SIM-002/ }),
    ).toHaveCount(0);
  });

  test("row click switches detail aside", async ({ page }) => {
    await page.goto("/virtual-vehicles");
    await page
      .getByRole("button", { name: /VV-REPLAY-014/ })
      .first()
      .click();
    await expect(
      page.getByRole("complementary", {
        name: /Virtual vehicle VV-REPLAY-014/i,
      }),
    ).toBeVisible();
  });

  test("sidebar nav round-trip Dashboard → Virtual Vehicles → Dashboard", async ({
    page,
  }) => {
    await page.goto("/dashboard");
    const nav = page.getByRole("navigation", { name: /primary/i });
    await nav.getByRole("link", { name: /virtual vehicles/i }).click();
    await expect(page).toHaveURL(/\/virtual-vehicles$/);
    await expect(
      nav.getByRole("link", { name: /virtual vehicles/i }),
    ).toHaveAttribute("aria-current", "page");
    await nav.getByRole("link", { name: /^dashboard$/i }).click();
    await expect(page).toHaveURL(/\/dashboard$/);
  });
});

import { test, expect } from "@playwright/test";

/**
 * Browser workflow smoke for the Virtual Vehicle Scenario
 * Catalog (mock-first baseline).
 *
 * Per `frontend-virtual-vehicle-scenario-catalog-baseline` spec:
 * the sub-route `/virtual-vehicles/scenarios` lists scenario
 * entries с canonical source markers (`simulator` / `liteReplay`
 * / `fullReplay`) + yaw + coordinate frame compatibility fields.
 * No raw protocol editor; create/edit affordances disabled (live
 * wiring lands в Track 3).
 */

const DESKTOP = { width: 1440, height: 900 } as const;

test.use({ viewport: DESKTOP });

test.describe("virtual vehicle scenario catalog (mock-mode baseline)", () => {
  test("/virtual-vehicles/scenarios renders heading + rows + canonical Lite/Full tokens", async ({
    page,
  }) => {
    await page.goto("/virtual-vehicles/scenarios");
    await expect(
      page.getByRole("heading", {
        level: 1,
        name: /^scenario catalog$/i,
      }),
    ).toBeVisible();
    await expect(
      page.getByRole("button", { name: /SC-CITY-A/ }).first(),
    ).toBeVisible();
    await expect(
      page.getByRole("button", { name: /SC-LITE-014/ }).first(),
    ).toBeVisible();
    await expect(
      page.getByRole("button", { name: /SC-FULL-042/ }).first(),
    ).toBeVisible();
    await expect(
      page.getByText("(liteReplay)").first(),
    ).toBeVisible();
    await expect(
      page.getByText("(fullReplay)").first(),
    ).toBeVisible();
  });

  test("Draft tab narrows to draft scenarios", async ({ page }) => {
    await page.goto("/virtual-vehicles/scenarios");
    await page.getByRole("tab", { name: /^draft$/i }).click();
    await expect(
      page.getByRole("button", { name: /SC-DRAFT-NEW/ }).first(),
    ).toBeVisible();
    await expect(
      page.getByRole("button", { name: /SC-CITY-A/ }),
    ).toHaveCount(0);
  });

  test("Row click switches detail aside; compatibility fields + no raw editor note visible", async ({
    page,
  }) => {
    await page.goto("/virtual-vehicles/scenarios");
    await page
      .getByRole("button", { name: /SC-FULL-042/ })
      .first()
      .click();
    const detail = page.getByRole("complementary", {
      name: /Scenario SC-FULL-042/i,
    });
    await expect(detail).toBeVisible();
    // Compatibility fields visible (yaw + coordinate frame).
    await expect(
      detail.getByText("(absolute)").first(),
    ).toBeVisible();
    await expect(detail.getByText("(geo)").first()).toBeVisible();
    // No raw protocol editor note operator-visible.
    await expect(
      detail.getByText(
        /raw protocol editor is intentionally not exposed/i,
      ),
    ).toBeVisible();
  });

  test("Breadcrumb back to Virtual Vehicles workspace", async ({
    page,
  }) => {
    await page.goto("/virtual-vehicles/scenarios");
    await page
      .getByRole("link", { name: /virtual vehicles/i })
      .first()
      .click();
    await expect(page).toHaveURL(/\/virtual-vehicles$/);
    await expect(
      page.getByRole("heading", { level: 1, name: /virtual vehicles/i }),
    ).toBeVisible();
  });

  test("Workspace surfaces Scenario catalog link in header", async ({
    page,
  }) => {
    await page.goto("/virtual-vehicles");
    await page
      .getByRole("link", { name: /scenario catalog/i })
      .first()
      .click();
    await expect(page).toHaveURL(/\/virtual-vehicles\/scenarios$/);
    await expect(
      page.getByRole("heading", {
        level: 1,
        name: /^scenario catalog$/i,
      }),
    ).toBeVisible();
  });
});

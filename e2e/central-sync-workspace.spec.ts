import { test, expect } from "@playwright/test";

const DESKTOP = { width: 1440, height: 900 } as const;
const MOBILE = { width: 375, height: 812 } as const;

test.describe("central sync workspace (mock-mode baseline)", () => {
  test.use({ viewport: DESKTOP });

  test("heading + optional chip + sync status + actions visible", async ({
    page,
  }) => {
    await page.goto("/central-sync");
    await expect(
      page.getByRole("heading", { level: 1, name: /central sync/i }),
    ).toBeVisible();
    await expect(page.getByText(/optional/i).first()).toBeVisible();
    await expect(
      page.getByRole("group", { name: /central sync actions/i }),
    ).toBeVisible();
    await expect(
      page.getByRole("table", { name: /recent sync packages/i }),
    ).toBeVisible();
  });

  test("Run sync + Export buttons enabled in mock-normal scenario", async ({
    page,
  }) => {
    await page.goto("/central-sync");
    await expect(
      page.getByRole("button", { name: /run sync/i }),
    ).toBeEnabled();
    await expect(
      page.getByRole("button", { name: /export read-models package/i }),
    ).toBeEnabled();
  });

  test("sidebar nav surfaces Central sync entry", async ({ page }) => {
    await page.goto("/dashboard");
    await page
      .getByRole("link", { name: /^central sync$/i })
      .first()
      .click();
    await expect(page).toHaveURL(/\/central-sync$/);
  });
});

test.describe("central sync workspace · mobile baseline", () => {
  test.use({ viewport: MOBILE });

  test("renders without horizontal overflow on 375x812 viewport", async ({
    page,
  }) => {
    await page.goto("/central-sync");
    await expect(
      page.getByRole("heading", { level: 1, name: /central sync/i }),
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

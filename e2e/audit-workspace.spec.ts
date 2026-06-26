import { test, expect } from "@playwright/test";

const DESKTOP = { width: 1440, height: 900 } as const;
const MOBILE = { width: 375, height: 812 } as const;

test.describe("audit workspace (mock-mode baseline)", () => {
  test.use({ viewport: DESKTOP });

  test("heading + actions + recent events table render", async ({
    page,
  }) => {
    await page.goto("/audit");
    await expect(
      page.getByRole("heading", { level: 1, name: /audit & integrity/i }),
    ).toBeVisible();
    await expect(
      page.getByRole("group", { name: /audit integrity actions/i }),
    ).toBeVisible();
    await expect(
      page.getByRole("table", { name: /audit event log/i }),
    ).toBeVisible();
  });

  test("verify + export buttons are enabled in mock fallback", async ({
    page,
  }) => {
    await page.goto("/audit");
    await expect(
      page.getByRole("heading", { level: 1, name: /audit & integrity/i }),
    ).toBeVisible();
    await expect(
      page.getByRole("button", { name: /run verification/i }),
    ).toBeEnabled();
    await expect(
      page.getByRole("button", { name: /export jsonl/i }),
    ).toBeEnabled();
    await expect(
      page.getByRole("button", { name: /export csv/i }),
    ).toBeEnabled();
  });

  test("sidebar nav surfaces Audit entry", async ({ page }) => {
    await page.goto("/dashboard");
    await page
      .getByRole("link", { name: /^audit$/i })
      .first()
      .click();
    await expect(page).toHaveURL(/\/audit$/);
  });
});

test.describe("audit workspace · mobile baseline", () => {
  test.use({ viewport: MOBILE });

  test("renders without horizontal overflow on 375x812 viewport", async ({
    page,
  }) => {
    await page.goto("/audit");
    await expect(
      page.getByRole("heading", { level: 1, name: /audit & integrity/i }),
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

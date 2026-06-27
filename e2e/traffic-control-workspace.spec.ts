import { test, expect } from "@playwright/test";

const DESKTOP = { width: 1440, height: 900 } as const;
const MOBILE = { width: 375, height: 812 } as const;

test.describe("traffic control workspace (mock-mode baseline)", () => {
  test.use({ viewport: DESKTOP });

  test("heading + controllers + lights tables render", async ({ page }) => {
    await page.goto("/traffic-control");
    await expect(
      page.getByRole("heading", { level: 1, name: /traffic control/i }),
    ).toBeVisible();
    await expect(
      page.getByRole("table", { name: /traffic controllers/i }),
    ).toBeVisible();
    await expect(
      page.getByRole("table", { name: /traffic lights/i }),
    ).toBeVisible();
  });

  test("setProgram command records entry; reset opens confirmation dialog", async ({
    page,
  }) => {
    await page.goto("/traffic-control");
    await page
      .getByRole("button", { name: /^setProgram$/i })
      .first()
      .click();
    await expect(
      page.getByRole("list", { name: /recent traffic commands/i }),
    ).toBeVisible();
    // Reset triggers confirmation dialog.
    await page
      .getByRole("button", { name: /^reset/i })
      .first()
      .click();
    await expect(
      page.getByRole("button", { name: /send dangerous command/i }),
    ).toBeVisible();
  });

  test("sidebar Traffic control entry navigates", async ({ page }) => {
    await page.goto("/dashboard");
    await page
      .getByRole("link", { name: /^traffic control$/i })
      .first()
      .click();
    await expect(page).toHaveURL(/\/traffic-control$/);
  });
});

test.describe("traffic control workspace · mobile baseline", () => {
  test.use({ viewport: MOBILE });

  test("renders without horizontal overflow on 375x812 viewport", async ({
    page,
  }) => {
    await page.goto("/traffic-control");
    await expect(
      page.getByRole("heading", { level: 1, name: /traffic control/i }),
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

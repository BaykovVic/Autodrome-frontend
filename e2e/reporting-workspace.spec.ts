import { test, expect } from "@playwright/test";

const DESKTOP = { width: 1440, height: 900 } as const;
const MOBILE = { width: 375, height: 812 } as const;

test.describe("reporting workspace (mock-mode baseline)", () => {
  test.use({ viewport: DESKTOP });

  test("heading + template catalog + recent reports render", async ({
    page,
  }) => {
    await page.goto("/reporting");
    await expect(
      page.getByRole("heading", { level: 1, name: /reporting/i }),
    ).toBeVisible();
    await expect(
      page.getByRole("table", { name: /reporting template catalog/i }),
    ).toBeVisible();
    await expect(
      page.getByRole("table", { name: /recent reports/i }),
    ).toBeVisible();
    await expect(page.getByText("(examProtocol)").first()).toBeVisible();
  });

  test("generate + export buttons are disabled", async ({ page }) => {
    await page.goto("/reporting");
    await expect(
      page.getByRole("heading", { level: 1, name: /reporting/i }),
    ).toBeVisible();
    await expect(
      page.getByRole("button", { name: /generate report/i }),
    ).toBeDisabled();
    await expect(
      page.getByRole("button", { name: /^export/i }),
    ).toBeDisabled();
  });

  test("sidebar nav surfaces reporting entry", async ({ page }) => {
    await page.goto("/dashboard");
    await page
      .getByRole("link", { name: /^reporting$/i })
      .first()
      .click();
    await expect(page).toHaveURL(/\/reporting$/);
    await expect(
      page.getByRole("heading", { level: 1, name: /reporting/i }),
    ).toBeVisible();
  });
});

test.describe("reporting workspace · mobile baseline", () => {
  test.use({ viewport: MOBILE });

  test("renders without horizontal overflow on 375x812 viewport", async ({
    page,
  }) => {
    await page.goto("/reporting");
    await expect(
      page.getByRole("heading", { level: 1, name: /reporting/i }),
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

import { test, expect } from "@playwright/test";

const DESKTOP = { width: 1440, height: 900 } as const;
const MOBILE = { width: 375, height: 812 } as const;

test.describe("security workspace (mock-mode baseline)", () => {
  test.use({ viewport: DESKTOP });

  test("heading + current actor + role matrix render", async ({ page }) => {
    await page.goto("/security");
    await expect(
      page.getByRole("heading", { level: 1, name: /security & identity/i }),
    ).toBeVisible();
    await expect(page.getByText(/Anna Petrova/).first()).toBeVisible();
    await expect(
      page.getByRole("table", { name: /operator role matrix/i }),
    ).toBeVisible();
    // 6 canonical role columns.
    await expect(page.getByText("(admin)").first()).toBeVisible();
    await expect(page.getByText("(techAdmin)").first()).toBeVisible();
  });

  test("assign/revoke buttons disabled per degraded scope", async ({
    page,
  }) => {
    await page.goto("/security");
    await expect(
      page.getByRole("heading", { level: 1, name: /security & identity/i }),
    ).toBeVisible();
    const firstAssign = page
      .getByRole("group", { name: /role actions for/i })
      .first()
      .getByRole("button", { name: /assign/i });
    await expect(firstAssign).toBeDisabled();
  });

  test("sidebar nav surfaces Security entry", async ({ page }) => {
    await page.goto("/dashboard");
    await page
      .getByRole("link", { name: /^security$/i })
      .first()
      .click();
    await expect(page).toHaveURL(/\/security$/);
  });
});

test.describe("security workspace · mobile baseline", () => {
  test.use({ viewport: MOBILE });

  test("renders without horizontal overflow on 375x812 viewport", async ({
    page,
  }) => {
    await page.goto("/security");
    await expect(
      page.getByRole("heading", { level: 1, name: /security & identity/i }),
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

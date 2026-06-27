import { test, expect } from "@playwright/test";

const DESKTOP = { width: 1440, height: 900 } as const;

test.describe("admin workspaces (reference / geometry / scheduling)", () => {
  test.use({ viewport: DESKTOP });

  test("reference data workspace renders dictionary picker + items", async ({
    page,
  }) => {
    await page.goto("/reference-data");
    await expect(
      page.getByRole("heading", { level: 1, name: /reference data/i }),
    ).toBeVisible();
    await expect(
      page.getByRole("group", { name: /dictionary picker/i }),
    ).toBeVisible();
    await expect(
      page.getByRole("table", { name: /reference dictionary items/i }),
    ).toBeVisible();
  });

  test("geometry workspace renders versions table", async ({ page }) => {
    await page.goto("/autodrome-geometry");
    await expect(
      page.getByRole("heading", {
        level: 1,
        name: /autodrome geometry/i,
      }),
    ).toBeVisible();
    await expect(
      page.getByRole("table", { name: /geometry versions/i }),
    ).toBeVisible();
  });

  test("scheduling workspace renders schedules + integrations tables", async ({
    page,
  }) => {
    await page.goto("/scheduling-integration");
    await expect(
      page.getByRole("heading", {
        level: 1,
        name: /scheduling & integration/i,
      }),
    ).toBeVisible();
    await expect(
      page.getByRole("table", { name: /schedule list/i }),
    ).toBeVisible();
    await expect(
      page.getByRole("table", { name: /integration status/i }),
    ).toBeVisible();
  });

  test("sidebar ADMIN group surfaces 3 entries (separate boundaries)", async ({
    page,
  }) => {
    await page.goto("/dashboard");
    await expect(
      page.getByRole("link", { name: /^reference data$/i }),
    ).toBeVisible();
    await expect(
      page.getByRole("link", { name: /^autodrome geometry$/i }),
    ).toBeVisible();
    await expect(
      page.getByRole("link", { name: /^scheduling$/i }),
    ).toBeVisible();
  });
});

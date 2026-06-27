import { test, expect } from "@playwright/test";

const DESKTOP = { width: 1440, height: 900 } as const;

test.describe("installer + update flow (mock-mode baseline)", () => {
  test.use({ viewport: DESKTOP });

  test("Installer tab surfaces phase + prerequisites + gated update", async ({
    page,
  }) => {
    await page.goto("/operations");
    await page.getByRole("tab", { name: /^installer$/i }).click();
    await expect(
      page.getByRole("region", { name: /installer overview/i }),
    ).toBeVisible();
    await expect(
      page.getByRole("table", { name: /installer prerequisites/i }),
    ).toBeVisible();
    // Update button gated until backup is acknowledged.
    await expect(
      page.getByRole("button", { name: /dispatch update/i }),
    ).toBeDisabled();
  });

  test("Backup acknowledgement unlocks update dispatch (mock)", async ({
    page,
  }) => {
    await page.goto("/operations");
    await page.getByRole("tab", { name: /^installer$/i }).click();
    await page
      .getByRole("button", { name: /run pre-update backup/i })
      .click();
    await expect(
      page.getByRole("button", { name: /dispatch update/i }),
    ).toBeEnabled();
  });
});

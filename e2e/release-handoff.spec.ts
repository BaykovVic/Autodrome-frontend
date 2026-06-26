import { test, expect } from "@playwright/test";

const DESKTOP = { width: 1440, height: 900 } as const;

test.describe("release artifact hand-off UI", () => {
  test.use({ viewport: DESKTOP });

  test("operations Release tab reachable + surfaces build metadata + checklist + hand-off", async ({
    page,
  }) => {
    await page.goto("/operations");
    await page.getByRole("tab", { name: /^release$/i }).click();
    const region = page.getByRole("region", {
      name: /release artifact hand-off/i,
    });
    await expect(region).toBeVisible();
    // Build metadata
    await expect(region.getByText(/Next\.js v16\.2\.9/i)).toBeVisible();
    // Checklist highlights list
    await expect(
      region.getByRole("list", {
        name: /release checklist highlights/i,
      }),
    ).toBeVisible();
    // Hand-off entries
    const handoff = region.getByRole("list", {
      name: /release hand-off entries/i,
    });
    await expect(handoff).toBeVisible();
    // Deploy hand-off API row + Degraded badge within hand-off list.
    await expect(handoff.getByText(/Deploy hand-off API/i)).toBeVisible();
    await expect(handoff.getByText(/Degraded/i)).toBeVisible();
  });
});

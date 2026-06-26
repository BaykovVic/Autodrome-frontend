import { test, expect } from "@playwright/test";

/**
 * Browser workflow smoke for Evidence Detail sub-route
 * `/evidence/[evidenceId]` (mock-first baseline).
 *
 * Per spec: media + report refs visible, explicit unavailable
 * states for playback/export, mobile + desktop responsive.
 */

const DESKTOP = { width: 1440, height: 900 } as const;
const MOBILE = { width: 375, height: 812 } as const;

test.describe("evidence detail (mock-mode baseline)", () => {
  test.use({ viewport: DESKTOP });

  test("sealed evidence: heading + meta + linked refs render", async ({
    page,
  }) => {
    await page.goto("/evidence/EVD-77210");
    await expect(
      page.getByRole("heading", { level: 1, name: /EVD-77210/ }),
    ).toBeVisible();
    await expect(page.getByText(/REC-77210-A/)).toBeVisible();
    await expect(page.getByText(/RPT-EXM-2026-0337/)).toBeVisible();
  });

  test("playback and export buttons are explicitly disabled", async ({
    page,
  }) => {
    await page.goto("/evidence/EVD-77210");
    await expect(
      page.getByRole("heading", { level: 1, name: /EVD-77210/ }),
    ).toBeVisible();
    await expect(
      page.getByRole("button", { name: /playback/i }),
    ).toBeDisabled();
    await expect(
      page.getByRole("button", { name: /export/i }),
    ).toBeDisabled();
  });

  test("failed evidence: manifestError + reportError surfaced", async ({
    page,
  }) => {
    await page.goto("/evidence/EVD-77204");
    await expect(
      page.getByRole("heading", { level: 1, name: /EVD-77204/ }),
    ).toBeVisible();
    await expect(
      page.getByLabel(/manifest error for REC-77204-PHOTO/i),
    ).toBeVisible();
    await expect(
      page.getByLabel(/report error for RPT-EXM-2026-0334/i),
    ).toBeVisible();
  });

  test("sealed evidence: segment table + timeline mapping table render", async ({
    page,
  }) => {
    await page.goto("/evidence/EVD-77210");
    await expect(
      page.getByRole("table", { name: /segments for REC-77210-A/i }),
    ).toBeVisible();
    await expect(
      page.getByRole("table", { name: /timeline for REC-77210-A/i }),
    ).toBeVisible();
    // Canonical source token visible in segment row.
    await expect(page.getByText(/\(cabinFront\)/i).first()).toBeVisible();
  });

  test("aggregate playback state taxonomy pills render", async ({
    page,
  }) => {
    await page.goto("/evidence/EVD-77210");
    await expect(
      page.getByRole("group", {
        name: /aggregate playback state taxonomy/i,
      }),
    ).toBeVisible();
    await expect(
      page.getByText(/\(recordingMetadataAvailable\)/i).first(),
    ).toBeVisible();
    await expect(
      page.getByText(/\(exportUnavailable\)/i).first(),
    ).toBeVisible();
  });

  test("evidence list → detail link navigates", async ({ page }) => {
    await page.goto("/evidence");
    await page
      .getByRole("link", { name: /open evidence detail →/i })
      .first()
      .click();
    await expect(page).toHaveURL(/\/evidence\/EVD-/);
    await expect(
      page.getByRole("heading", { level: 1, name: /EVD-/ }),
    ).toBeVisible();
  });
});

test.describe("evidence detail · mobile baseline", () => {
  test.use({ viewport: MOBILE });

  test("renders without horizontal overflow on 375x812 viewport", async ({
    page,
  }) => {
    await page.goto("/evidence/EVD-77210");
    await expect(
      page.getByRole("heading", { level: 1, name: /EVD-77210/ }),
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

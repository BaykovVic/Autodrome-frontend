import { test, expect } from "@playwright/test";

/**
 * Composite browser workflow E2E (mock-mode deterministic)
 * for evidence + reporting + media playback degraded states.
 *
 * Scope per spec:
 *   - Reporting request workflow (catalog read + disabled
 *     submission).
 *   - Evidence detail workflow (list → detail → state pills).
 *   - Media metadata / degraded playback workflow (segments
 *     + timeline + degraded-state taxonomy across recordings).
 *   - Mock mode deterministic — все fixtures keyed по
 *     canonical ids, e2e не зависит от live backend.
 *
 * Live opt-in: `NEXT_PUBLIC_API_ADAPTER=live` свитчит loaders;
 * этот workflow остаётся mock-deterministic.
 */

const DESKTOP = { width: 1440, height: 900 } as const;
const MOBILE = { width: 375, height: 812 } as const;

test.describe("evidence + reporting composite workflow (mock)", () => {
  test.use({ viewport: DESKTOP });

  test("workflow A: evidence list → sealed detail → playback state taxonomy → reporting catalog", async ({
    page,
  }) => {
    // 1. Evidence list visible.
    await page.goto("/evidence");
    await expect(
      page.getByRole("heading", { level: 1, name: /evidence/i }),
    ).toBeVisible();

    // 2. Open detail aside via row click; navigate to detail
    // page via "Open evidence detail →" link.
    await page
      .getByRole("link", { name: /open evidence detail →/i })
      .first()
      .click();
    await expect(page).toHaveURL(/\/evidence\/EVD-/);
    await expect(
      page.getByRole("heading", { level: 1, name: /EVD-/ }),
    ).toBeVisible();

    // 3. Playback aggregate group present; exportUnavailable
    // always rendered.
    await expect(
      page.getByRole("group", {
        name: /aggregate playback state taxonomy/i,
      }),
    ).toBeVisible();
    await expect(
      page.getByText(/\(exportUnavailable\)/i).first(),
    ).toBeVisible();

    // 4. Playback + export buttons remain disabled.
    await expect(
      page.getByRole("button", { name: /playback/i }),
    ).toBeDisabled();
    await expect(
      page.getByRole("button", { name: /^export/i }),
    ).toBeDisabled();

    // 5. Cross-link: navigate to reporting workspace via
    // sidebar.
    await page
      .getByRole("link", { name: /^reporting$/i })
      .first()
      .click();
    await expect(page).toHaveURL(/\/reporting$/);
    await expect(
      page.getByRole("table", { name: /reporting template catalog/i }),
    ).toBeVisible();
    await expect(
      page.getByRole("button", { name: /generate report/i }),
    ).toBeDisabled();
  });

  test("workflow B: failed evidence (EVD-77204) renders retentionChecksumIssue + report failed", async ({
    page,
  }) => {
    await page.goto("/evidence/EVD-77204");
    await expect(
      page.getByRole("heading", { level: 1, name: /EVD-77204/ }),
    ).toBeVisible();
    // Playback taxonomy surfaces retentionChecksumIssue.
    await expect(
      page.getByText(/\(retentionChecksumIssue\)/i).first(),
    ).toBeVisible();
    // Manifest error panel visible.
    await expect(
      page.getByLabel(/manifest error for REC-77204-PHOTO/i),
    ).toBeVisible();
    // Report panel shows fetch error.
    await expect(
      page.getByLabel(/report error for RPT-EXM-2026-0334/i),
    ).toBeVisible();
  });

  test("workflow C: active recording (EVD-77212) → manifestUnavailable + no reports listed", async ({
    page,
  }) => {
    await page.goto("/evidence/EVD-77212");
    await expect(
      page.getByRole("heading", { level: 1, name: /EVD-77212/ }),
    ).toBeVisible();
    await expect(
      page.getByText(/\(manifestUnavailable\)/i).first(),
    ).toBeVisible();
    await expect(
      page.getByText(/no linked reporting documents/i),
    ).toBeVisible();
  });

  test("workflow D: media metadata — sealed recording surfaces segments + timeline + canonical source chips", async ({
    page,
  }) => {
    await page.goto("/evidence/EVD-77210");
    await expect(
      page.getByRole("table", { name: /segments for REC-77210-A/i }),
    ).toBeVisible();
    await expect(
      page.getByRole("table", { name: /timeline for REC-77210-A/i }),
    ).toBeVisible();
    await expect(page.getByText(/\(cabinFront\)/i).first()).toBeVisible();
    await expect(
      page.getByText(/\(recordingMetadataAvailable\)/i).first(),
    ).toBeVisible();
  });

  test("workflow E: reporting catalog → recent reports → disabled submission affordances", async ({
    page,
  }) => {
    await page.goto("/reporting");
    await expect(
      page.getByRole("heading", { level: 1, name: /reporting/i }),
    ).toBeVisible();
    // Templates table renders canonical type chips.
    await expect(
      page.getByText("(examProtocol)").first(),
    ).toBeVisible();
    // Recent reports table includes ready / inProgress / failed.
    const reports = page.getByRole("table", { name: /recent reports/i });
    await expect(reports.getByText(/RPT-EXM-2026-0337/)).toBeVisible();
    await expect(reports.getByText(/RPT-EXM-2026-0338/)).toBeVisible();
    await expect(reports.getByText(/RPT-EXM-2026-0334/)).toBeVisible();
    // Submission disabled per spec rule.
    await expect(
      page.getByRole("button", { name: /generate report/i }),
    ).toBeDisabled();
  });
});

test.describe("evidence + reporting composite workflow · mobile", () => {
  test.use({ viewport: MOBILE });

  test("mobile workflow: evidence detail + reporting accessible without overflow", async ({
    page,
  }) => {
    await page.goto("/evidence/EVD-77210");
    await expect(
      page.getByRole("heading", { level: 1, name: /EVD-77210/ }),
    ).toBeVisible();
    let scrollWidth = await page.evaluate(
      () => document.documentElement.scrollWidth,
    );
    let clientWidth = await page.evaluate(
      () => document.documentElement.clientWidth,
    );
    expect(scrollWidth).toBeLessThanOrEqual(clientWidth + 1);

    await page.goto("/reporting");
    await expect(
      page.getByRole("heading", { level: 1, name: /reporting/i }),
    ).toBeVisible();
    scrollWidth = await page.evaluate(
      () => document.documentElement.scrollWidth,
    );
    clientWidth = await page.evaluate(
      () => document.documentElement.clientWidth,
    );
    expect(scrollWidth).toBeLessThanOrEqual(clientWidth + 1);
  });
});

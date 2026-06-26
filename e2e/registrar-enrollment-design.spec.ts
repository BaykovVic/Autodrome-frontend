import { test, expect } from "@playwright/test";

/**
 * Design follow-up E2E для registrar face enrollment
 * flow.
 *
 * Существующие реализации (уже в develop):
 *   - `StartEnrollmentDialog` — channel picker
 *     (registrar tablet vs local camera) с online/
 *     offline state cards.
 *   - `CameraStationScreen` (`/capture/[sessionId]`) —
 *     mock-only capture window для второго монитора с
 *     mock retry / cancel / done сценариями.
 *
 * Этот spec formalizes design follow-up scope:
 *   - capture-window route reachable;
 *   - capture control panel + quality progress visible;
 *   - retry / cancel / done операторские override
 *     affordances surfaced (mock-only, никакой live
 *     camera capture).
 */

const DESKTOP = { width: 1440, height: 900 } as const;
const MOBILE = { width: 375, height: 812 } as const;

test.describe("registrar enrollment design follow-up", () => {
  test.use({ viewport: DESKTOP });

  test("capture-window dialog reachable with quality chips + progress", async ({
    page,
  }) => {
    await page.goto("/capture/ENR-9F41");
    await expect(
      page.getByRole("dialog", { name: /capture window/i }),
    ).toBeVisible();
    await expect(page.getByLabel(/quality checks/i)).toBeVisible();
    await expect(
      page.getByRole("progressbar", { name: /capture progress/i }),
    ).toBeVisible();
  });

  test("camera-station screen reachable from /candidates/sessions/{id}/camera-station", async ({
    page,
  }) => {
    await page.goto("/candidates/sessions/ENR-9F41/camera-station");
    await expect(
      page.getByRole("heading", { level: 1, name: /camera station/i }),
    ).toBeVisible();
    await expect(
      page.getByLabel(/capture control panel/i),
    ).toBeVisible();
    await expect(
      page.getByLabel(/capture quality progress/i),
    ).toBeVisible();
  });

  test("enrollment dialog channel picker reachable from /candidates/new", async ({
    page,
  }) => {
    await page.goto("/candidates/new");
    // Fill in minimal valid form first (otherwise CTA stays
    // disabled).
    await page.getByLabel(/full name/i).fill("Test Candidate");
    await page.getByLabel(/date of birth/i).fill("12.04.2001");
    await page.getByLabel(/document \/ license/i).fill("DL-77-014562");
    await page
      .getByRole("button", { name: /save and start enrollment/i })
      .click();
    const dialog = page.getByRole("dialog", {
      name: /start face enrollment/i,
    });
    await expect(dialog).toBeVisible();
    // Default tab is "registrar" — registrar state visible.
    await expect(
      dialog.getByLabel(/registrar tablet state/i),
    ).toBeVisible();
    // Switching to "local web camera" surfaces local camera state.
    await dialog
      .getByRole("tab", { name: /local web camera/i })
      .click();
    await expect(
      dialog.getByLabel(/local camera state/i),
    ).toBeVisible();
  });

  test("mobile capture window dialog reachable", async ({ browser }) => {
    const ctx = await browser.newContext({ viewport: MOBILE });
    const page = await ctx.newPage();
    await page.goto("/capture/ENR-9F41");
    await expect(
      page.getByRole("dialog", { name: /capture window/i }),
    ).toBeVisible();
    await ctx.close();
  });
});

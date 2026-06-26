import { test, expect } from "@playwright/test";

/**
 * Autodrome design closure spec (Track 7 / F2-F5).
 *
 * Formalizes existing safety + polish indicators в e2e:
 *   - VV workspace показывает canonical source chips
 *     (simulator / legacyReplay / operatorManual) рядом с
 *     operator labels — operator не может перепутать
 *     virtual и real vehicles.
 *   - VV session monitor disabled Start/Pause/Resume/Stop
 *     buttons (destructive actions protected).
 *   - VV manual control disabled controls на non-running
 *     sessions (degraded telemetry safety).
 *   - Runtime preview "noRuntime" state suppresses pose
 *     rendering.
 *   - Operations diagnostics + backups regions reachable
 *     без destructive submission.
 *
 * Без runtime code changes — все surfaces уже шипнуты.
 */

const DESKTOP = { width: 1440, height: 900 } as const;

test.describe("autodrome design closure (T7-F2/F3/F4/F5)", () => {
  test.use({ viewport: DESKTOP });

  test("VV workspace surfaces canonical source chips (simulator / legacyReplay) — operator cannot confuse virtual with real", async ({
    page,
  }) => {
    await page.goto("/virtual-vehicles");
    await expect(page.getByText("(simulator)").first()).toBeVisible();
    await expect(page.getByText("(legacyReplay)").first()).toBeVisible();
  });

  test("VV session monitor: Start/Pause/Resume/Stop are disabled (destructive actions protected)", async ({
    page,
  }) => {
    await page.goto("/virtual-vehicles/sessions/VV-SIM-001");
    const group = page.getByRole("group", {
      name: /session command affordances/i,
    });
    for (const name of [/^start$/i, /^pause$/i, /^resume$/i, /^stop$/i]) {
      await expect(group.getByRole("button", { name })).toBeDisabled();
    }
  });

  test("VV manual control on paused session: speed + steering sliders disabled", async ({
    page,
  }) => {
    await page.goto(
      "/virtual-vehicles/sessions/VV-REPLAY-014/manual-control",
    );
    await expect(
      page.getByRole("slider", { name: /target speed/i }),
    ).toBeDisabled();
    await expect(
      page.getByRole("slider", { name: /steering normalized/i }),
    ).toBeDisabled();
  });

  test("Runtime preview noRuntime state suppresses pose (no fake telemetry)", async ({
    page,
  }) => {
    await page.goto(
      "/virtual-vehicles/sessions/VV-REPLAY-OLD/runtime-preview",
    );
    await expect(
      page.getByText(/no pose telemetry has been captured yet/i),
    ).toBeVisible();
    // Никаких "km/h" значений — pose suppressed.
    await expect(page.getByText(/\d+ km\/h/i)).not.toBeVisible();
  });

  test("Operations diagnostics + backups regions reachable + no destructive auto-clicks", async ({
    page,
  }) => {
    await page.goto("/operations");
    await page.getByRole("tab", { name: /^diagnostics$/i }).click();
    await expect(
      page.getByRole("region", { name: /diagnostics overview/i }),
    ).toBeVisible();
    await page.getByRole("tab", { name: /^backups$/i }).click();
    await expect(
      page.getByRole("region", { name: /backups overview/i }),
    ).toBeVisible();
    // Spec не кликает destructive buttons — safety
    // constraint documented in code.
  });

  test("Responsive: VV manual control adapts to mobile viewport without horizontal overflow", async ({
    browser,
  }) => {
    const ctx = await browser.newContext({
      viewport: { width: 375, height: 812 },
    });
    const page = await ctx.newPage();
    await page.goto("/virtual-vehicles/sessions/VV-SIM-001/manual-control");
    await expect(
      page.getByRole("heading", { level: 1, name: /manual control/i }),
    ).toBeVisible();
    const scrollWidth = await page.evaluate(
      () => document.documentElement.scrollWidth,
    );
    const clientWidth = await page.evaluate(
      () => document.documentElement.clientWidth,
    );
    expect(scrollWidth).toBeLessThanOrEqual(clientWidth + 1);
    await ctx.close();
  });
});

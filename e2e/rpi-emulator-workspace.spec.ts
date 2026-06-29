import { test, expect } from "@playwright/test";

/**
 * Browser workflow smoke for the RPi hardware emulator workspace
 * (mock-mode baseline).
 *
 * Per spec: list/detail-equivalent surface, runtime + bridge cards,
 * legacy scenario source marker, playback controls gated by phase,
 * not mixed with Web VirtualVehicle.
 */

const DESKTOP = { width: 1440, height: 900 } as const;

test.use({ viewport: DESKTOP });

test.describe("rpi emulator workspace (mock-mode baseline)", () => {
  test("/rpi-emulator renders heading + RPi source chip + runtime + bridge cards", async ({
    page,
  }) => {
    await page.goto("/rpi-emulator");
    await expect(
      page.getByRole("heading", {
        level: 1,
        name: /RPi hardware emulator/i,
      }),
    ).toBeVisible();
    // Canonical source chip must be visible so operator cannot
    // confuse this view with the Web VirtualVehicle workspace.
    await expect(
      page.getByText("(rpiHardware)"),
    ).toBeVisible();
    await expect(
      page.getByRole("region", { name: /emulator runtime status/i }),
    ).toBeVisible();
    await expect(
      page.getByRole("region", { name: /tablet\/web bridge status/i }),
    ).toBeVisible();
  });

  test("/rpi-emulator surfaces canonical Lite/Full scenario format token alongside operator label", async ({
    page,
  }) => {
    await page.goto("/rpi-emulator");
    await expect(
      page.getByRole("heading", { level: 1 }),
    ).toBeVisible();
    // Default fixture is `loaded` scenario in `legacyLiteReplay`
    // format → canonical token visible as `(legacyLiteReplay)`.
    await expect(
      page.getByText(/\(legacyLiteReplay\)/i),
    ).toBeVisible();
  });

  test("Sidebar route round-trip Dashboard → RPi Emulator → Dashboard", async ({
    page,
  }) => {
    await page.goto("/dashboard");
    const nav = page.getByRole("navigation", { name: /primary/i });
    await nav.getByRole("link", { name: /^rpi emulator$/i }).click();
    await expect(page).toHaveURL(/\/rpi-emulator$/);
    await expect(
      page.getByRole("heading", {
        level: 1,
        name: /RPi hardware emulator/i,
      }),
    ).toBeVisible();
    await nav.getByRole("link", { name: /^dashboard$/i }).click();
    await expect(page).toHaveURL(/\/dashboard$/);
  });
});

import { test, expect } from "@playwright/test";

/**
 * Browser workflow smoke for the Virtual Vehicle Session
 * Monitor (mock-first baseline).
 *
 * Dynamic sub-route `/virtual-vehicles/sessions/[sessionId]`
 * renders runtime status cards + event log + Start/Pause/
 * Resume/Stop affordances для одной session. Affordances
 * disabled per spec; live wiring lands в Track 3.
 */

const DESKTOP = { width: 1440, height: 900 } as const;

test.use({ viewport: DESKTOP });

test.describe("virtual vehicle session monitor (mock-mode baseline)", () => {
  test("running session: heading + canonical chips + event log render", async ({
    page,
  }) => {
    await page.goto("/virtual-vehicles/sessions/VV-SIM-001");
    await expect(
      page.getByRole("heading", { level: 1, name: /VV-SIM-001/ }),
    ).toBeVisible();
    // Runtime cards canonical chips.
    await expect(
      page.getByText("(simulator)").first(),
    ).toBeVisible();
    await expect(
      page.getByText("(telemetryTick)").first(),
    ).toBeVisible();
    // Event log section visible с canonical event-kind chip.
    await expect(page.getByText(/Event log/i)).toBeVisible();
    await expect(
      page.getByText("(sessionStarted)").first(),
    ).toBeVisible();
  });

  test("paused session: sessionPaused event visible + commands disabled", async ({
    page,
  }) => {
    await page.goto("/virtual-vehicles/sessions/VV-REPLAY-014");
    await expect(
      page.getByRole("heading", { level: 1, name: /VV-REPLAY-014/ }),
    ).toBeVisible();
    await expect(
      page.getByText("(sessionPaused)").first(),
    ).toBeVisible();
    const commandGroup = page.getByRole("group", {
      name: /session command affordances/i,
    });
    await expect(
      commandGroup.getByRole("button", { name: /^start$/i }),
    ).toBeDisabled();
    await expect(
      commandGroup.getByRole("button", { name: /^pause$/i }),
    ).toBeDisabled();
    await expect(
      commandGroup.getByRole("button", { name: /^resume$/i }),
    ).toBeDisabled();
    await expect(
      commandGroup.getByRole("button", { name: /^stop$/i }),
    ).toBeDisabled();
  });

  test("degraded session: warning chips + degraded event surface", async ({
    page,
  }) => {
    await page.goto("/virtual-vehicles/sessions/VV-SIM-DEGRADED");
    await expect(
      page.getByRole("heading", { level: 1, name: /VV-SIM-DEGRADED/ }),
    ).toBeVisible();
    await expect(
      page.getByText("(cellular)").first(),
    ).toBeVisible();
    await expect(
      page.getByText("(degraded)").first(),
    ).toBeVisible();
  });

  test("unknown session id: empty runtime + event log, no fake data", async ({
    page,
  }) => {
    await page.goto("/virtual-vehicles/sessions/VV-DOES-NOT-EXIST");
    await expect(
      page.getByRole("heading", {
        level: 1,
        name: /VV-DOES-NOT-EXIST/,
      }),
    ).toBeVisible();
    await expect(
      page.getByText(/No runtime telemetry available/i),
    ).toBeVisible();
    await expect(
      page.getByText(/No events recorded yet/i),
    ).toBeVisible();
  });

  test("workspace detail aside surfaces 'Open session monitor →' link", async ({
    page,
  }) => {
    await page.goto("/virtual-vehicles");
    // Default selection points at first device — running sim
    // (VV-SIM-001).
    await page
      .getByRole("link", { name: /open session monitor/i })
      .first()
      .click();
    await expect(page).toHaveURL(/\/virtual-vehicles\/sessions\//);
    await expect(
      page.getByRole("heading", { level: 1, name: /VV-/ }),
    ).toBeVisible();
  });
});

import { test, expect } from "@playwright/test";

/**
 * Browser workflow smoke for the Virtual Vehicle Manual Control
 * panel (mock-first baseline). Sub-route
 * `/virtual-vehicles/sessions/[sessionId]/manual-control`.
 *
 * Per spec: speed/steering sliders, position reset, sensor
 * toggles using canonical capability tokens (no raw bitmask UI),
 * disabled states when session not running, mobile + desktop
 * accessible.
 */

const DESKTOP = { width: 1440, height: 900 } as const;
const MOBILE = { width: 375, height: 812 } as const;

test.describe("virtual vehicle manual control (mock-mode baseline)", () => {
  test.use({ viewport: DESKTOP });

  test("running session: heading + sliders + sensor canonical chips render", async ({
    page,
  }) => {
    await page.goto(
      "/virtual-vehicles/sessions/VV-SIM-001/manual-control",
    );
    await expect(
      page.getByRole("heading", { level: 1, name: /manual control/i }),
    ).toBeVisible();
    await expect(
      page.getByRole("slider", { name: /target speed in km\/h/i }),
    ).toBeEnabled();
    await expect(
      page.getByRole("slider", { name: /steering normalized/i }),
    ).toBeEnabled();
    // Canonical sensor tokens visible.
    await expect(page.getByText("(cameraFront)").first()).toBeVisible();
    await expect(page.getByText("(lidar)").first()).toBeVisible();
    await expect(page.getByText("(gnss)").first()).toBeVisible();
    await expect(page.getByText("(lanePerception)").first()).toBeVisible();
    await expect(
      page.getByText(/no raw bitmask UI is exposed/i),
    ).toBeVisible();
  });

  test("paused session: controls disabled + reason banner shown", async ({
    page,
  }) => {
    await page.goto(
      "/virtual-vehicles/sessions/VV-REPLAY-014/manual-control",
    );
    await expect(
      page.getByRole("heading", { level: 1, name: /manual control/i }),
    ).toBeVisible();
    await expect(
      page.getByRole("slider", { name: /target speed in km\/h/i }),
    ).toBeDisabled();
    await expect(
      page.getByRole("button", { name: /reset position/i }),
    ).toBeDisabled();
    await expect(page.getByRole("status")).toContainText(
      /session is paused/i,
    );
  });

  test("degraded session: lidar + gnss checkboxes off and disabled", async ({
    page,
  }) => {
    await page.goto(
      "/virtual-vehicles/sessions/VV-SIM-DEGRADED/manual-control",
    );
    await expect(
      page.getByRole("heading", { level: 1, name: /manual control/i }),
    ).toBeVisible();
    const lidar = page.getByRole("checkbox", {
      name: /Lidar \(lidar\)/i,
    });
    const gnss = page.getByRole("checkbox", {
      name: /GNSS \(gnss\)/i,
    });
    await expect(lidar).not.toBeChecked();
    await expect(gnss).not.toBeChecked();
    await expect(lidar).toBeDisabled();
    await expect(gnss).toBeDisabled();
  });

  test("session monitor → manual control link navigates", async ({
    page,
  }) => {
    await page.goto("/virtual-vehicles/sessions/VV-SIM-001");
    await page.getByRole("link", { name: /manual control →/i }).click();
    await expect(page).toHaveURL(
      /\/virtual-vehicles\/sessions\/VV-SIM-001\/manual-control$/,
    );
    await expect(
      page.getByRole("heading", { level: 1, name: /manual control/i }),
    ).toBeVisible();
  });
});

test.describe("virtual vehicle manual control · mobile baseline", () => {
  test.use({ viewport: MOBILE });

  test("renders without horizontal overflow on 375x812 viewport", async ({
    page,
  }) => {
    await page.goto(
      "/virtual-vehicles/sessions/VV-SIM-001/manual-control",
    );
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
  });
});

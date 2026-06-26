import { test, expect } from "@playwright/test";

/**
 * Browser workflow smoke for the Virtual Vehicle Runtime
 * Preview (mock-first baseline). Sub-route
 * `/virtual-vehicles/sessions/[sessionId]/runtime-preview`.
 *
 * Per spec: position/yaw/speed/gear/sensors preview + scenario
 * source and compatibility badges + degraded/no-runtime
 * states + read-only (no live telemetry dependency).
 */

const DESKTOP = { width: 1440, height: 900 } as const;
const MOBILE = { width: 375, height: 812 } as const;

test.describe("virtual vehicle runtime preview (mock-mode baseline)", () => {
  test.use({ viewport: DESKTOP });

  test("running session: pose + speed + gear + simulator badge render", async ({
    page,
  }) => {
    await page.goto(
      "/virtual-vehicles/sessions/VV-SIM-001/runtime-preview",
    );
    await expect(
      page.getByRole("heading", { level: 1, name: /runtime preview/i }),
    ).toBeVisible();
    await expect(page.getByText(/42\.18 m E, -7\.93 m N/)).toBeVisible();
    await expect(page.getByText(/47 km\/h/)).toBeVisible();
    await expect(page.getByText("(drive)").first()).toBeVisible();
    const badges = page.getByRole("group", {
      name: /scenario compatibility badges/i,
    });
    await expect(badges.getByText("(simulator)")).toBeVisible();
    await expect(badges.getByText("(relative)")).toBeVisible();
    await expect(badges.getByText("(local)")).toBeVisible();
  });

  test("degraded session: warning banner + offline lidar + degraded gnss visible", async ({
    page,
  }) => {
    await page.goto(
      "/virtual-vehicles/sessions/VV-SIM-DEGRADED/runtime-preview",
    );
    await expect(
      page.getByRole("heading", { level: 1, name: /runtime preview/i }),
    ).toBeVisible();
    await expect(page.getByRole("status")).toContainText(
      /runtime is degraded/i,
    );
    const list = page.getByRole("list", { name: /sensor health/i });
    await expect(list.getByText("(degraded)").first()).toBeVisible();
    await expect(list.getByText("(offline)").first()).toBeVisible();
  });

  test("noRuntime session: pose suppressed + 'no runtime snapshot' banner", async ({
    page,
  }) => {
    await page.goto(
      "/virtual-vehicles/sessions/VV-REPLAY-OLD/runtime-preview",
    );
    await expect(
      page.getByRole("heading", { level: 1, name: /runtime preview/i }),
    ).toBeVisible();
    await expect(page.getByRole("status")).toContainText(
      /no runtime snapshot/i,
    );
    await expect(
      page.getByText(/no pose telemetry has been captured yet/i),
    ).toBeVisible();
  });

  test("session monitor → runtime preview link navigates", async ({
    page,
  }) => {
    await page.goto("/virtual-vehicles/sessions/VV-SIM-001");
    await page
      .getByRole("link", { name: /runtime preview →/i })
      .click();
    await expect(page).toHaveURL(
      /\/virtual-vehicles\/sessions\/VV-SIM-001\/runtime-preview$/,
    );
    await expect(
      page.getByRole("heading", { level: 1, name: /runtime preview/i }),
    ).toBeVisible();
  });
});

test.describe("virtual vehicle runtime preview · mobile baseline", () => {
  test.use({ viewport: MOBILE });

  test("renders without horizontal overflow on 375x812 viewport", async ({
    page,
  }) => {
    await page.goto(
      "/virtual-vehicles/sessions/VV-SIM-001/runtime-preview",
    );
    await expect(
      page.getByRole("heading", { level: 1, name: /runtime preview/i }),
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

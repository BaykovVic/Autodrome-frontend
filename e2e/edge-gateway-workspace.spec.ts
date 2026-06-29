import { test, expect } from "@playwright/test";

/**
 * Browser workflow smoke for the vehicle edge gateway monitoring
 * surface (mock-mode baseline).
 *
 * Per spec: gateway status, vehicle binding, last telemetry sample
 * indicators, degraded state for disconnected gateway. Raw serial
 * frames are NOT surfaced — only canonical EdgeRuntimeStatus.
 */

const DESKTOP = { width: 1440, height: 900 } as const;

test.use({ viewport: DESKTOP });

test.describe("edge gateway workspace (mock-mode baseline)", () => {
  test("/edge-gateway renders heading + realHardwareEdge source chip + runtime + queue cards", async ({
    page,
  }) => {
    await page.goto("/edge-gateway");
    await expect(
      page.getByRole("heading", {
        level: 1,
        name: /vehicle edge gateway/i,
      }),
    ).toBeVisible();
    // Canonical source chip distinguishes this view from the
    // RPi emulator workspace (`(rpiHardware)`).
    await expect(page.getByText("(realHardwareEdge)")).toBeVisible();
    await expect(
      page.getByRole("region", { name: /gateway runtime status/i }),
    ).toBeVisible();
    await expect(
      page.getByRole("region", { name: /forward queue status/i }),
    ).toBeVisible();
  });

  test("/edge-gateway shows a forwarding-healthy banner for the default mock fixture", async ({
    page,
  }) => {
    await page.goto("/edge-gateway");
    await expect(
      page.getByRole("heading", { level: 1 }),
    ).toBeVisible();
    const banner = page.getByLabel(
      /Edge gateway integration health/i,
    );
    await expect(banner).toBeVisible();
    await expect(banner.getByText(/forwarding healthy/i)).toBeVisible();
  });

  test("/edge-gateway renders visible Forward queue gap + Upstream heartbeat gap badges", async ({
    page,
  }) => {
    await page.goto("/edge-gateway");
    await expect(
      page.getByRole("heading", { level: 1 }),
    ).toBeVisible();
    // Both gap indicators are operator-visible regions per spec
    // ("Last telemetry sample/gap indicators"). Mock-mode default
    // fixture is `forwarding` so labels include the 30 s threshold
    // text — assert structural visibility rather than exact freshness
    // (page renders > 30 s after fixture timestamps so 'stale' is
    // expected; either way both gap regions must be present).
    await expect(
      page.getByLabel(/Forward queue gap/i),
    ).toBeVisible();
    await expect(
      page.getByLabel(/Upstream heartbeat gap/i),
    ).toBeVisible();
  });

  test("Sidebar route round-trip Dashboard → Edge Gateway → Dashboard", async ({
    page,
  }) => {
    await page.goto("/dashboard");
    const nav = page.getByRole("navigation", { name: /primary/i });
    await nav.getByRole("link", { name: /^edge gateway$/i }).click();
    await expect(page).toHaveURL(/\/edge-gateway$/);
    await expect(
      page.getByRole("heading", {
        level: 1,
        name: /vehicle edge gateway/i,
      }),
    ).toBeVisible();
    await nav.getByRole("link", { name: /^dashboard$/i }).click();
    await expect(page).toHaveURL(/\/dashboard$/);
  });
});

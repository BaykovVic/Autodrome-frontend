import { test, expect } from "@playwright/test";

/**
 * Browser workflow smoke for the Android Devices admin workspace.
 *
 * Per `frontend-android-device-admin-workspace-baseline` spec:
 * the `/devices` workspace is the mock-first baseline for the
 * cross-scope Android device-management track. No live API calls
 * are wired in this feature; assign/policy/retire affordances are
 * disabled with operator-visible tooltips per spec rule "не
 * притворяться live success".
 *
 * Coverage:
 *
 *   - `/devices` renders the workspace heading + status filter
 *     tabs + table rows seeded from the mock default scenario;
 *   - selecting a row updates the detail aside;
 *   - status filter tabs (Pending / Active / Retired) narrow the
 *     visible list without crashing;
 *   - sidebar nav round-trip Dashboard → Android Devices →
 *     Dashboard keeps `aria-current="page"` correct.
 *
 * Live transport will be added in
 * `feature/frontend-android-device-management-live-api-integration`.
 */

const DESKTOP = { width: 1440, height: 900 } as const;

test.use({ viewport: DESKTOP });

test.describe("android devices workspace (mock-mode baseline)", () => {
  test("/devices renders heading, status tabs, and device rows", async ({
    page,
  }) => {
    await page.goto("/devices");
    await expect(
      page.getByRole("heading", { level: 1, name: /android devices/i }),
    ).toBeVisible();

    // Status filter tabs.
    await expect(page.getByRole("tab", { name: /^all$/i })).toBeVisible();
    await expect(
      page.getByRole("tab", { name: /^pending$/i }),
    ).toBeVisible();
    await expect(
      page.getByRole("tab", { name: /^active$/i }),
    ).toBeVisible();
    await expect(
      page.getByRole("tab", { name: /^retired$/i }),
    ).toBeVisible();

    // Mock default scenario seeds at least a pending + several
    // active devices.
    await expect(
      page.getByRole("button", { name: /AD-7F02-PEND/ }).first(),
    ).toBeVisible();
    await expect(
      page.getByRole("button", { name: /AD-3A11-REG/ }).first(),
    ).toBeVisible();
  });

  test("/devices: Pending filter narrows the visible list to pending devices", async ({
    page,
  }) => {
    await page.goto("/devices");
    await page.getByRole("tab", { name: /^pending$/i }).click();
    await expect(
      page.getByRole("tab", { name: /^pending$/i }),
    ).toHaveAttribute("aria-selected", "true");
    await expect(
      page.getByRole("button", { name: /AD-7F02-PEND/ }).first(),
    ).toBeVisible();
    // No active devices visible after pending filter.
    await expect(
      page.getByRole("button", { name: /AD-3A11-REG/ }),
    ).toHaveCount(0);
  });

  test("/devices: clicking a device row switches the detail aside", async ({
    page,
  }) => {
    await page.goto("/devices");
    await page
      .getByRole("button", { name: /AD-9D14-VV/ })
      .first()
      .click();
    await expect(
      page.getByRole("complementary", { name: /Device AD-9D14-VV/i }),
    ).toBeVisible();
  });

  test("/devices: assign / edit policy / retire affordances are disabled with operator tooltips", async ({
    page,
  }) => {
    await page.goto("/devices");
    const detail = page.getByRole("complementary", {
      name: /Device AD-7F02-PEND/i,
    });
    await expect(detail).toBeVisible();
    await expect(
      detail.getByRole("button", { name: /assign/i }),
    ).toBeDisabled();
    await expect(
      detail.getByRole("button", { name: /edit policy/i }),
    ).toBeDisabled();
    await expect(
      detail.getByRole("button", { name: /^retire$/i }),
    ).toBeDisabled();
  });

  test("Sidebar round-trip Dashboard → Android Devices → Dashboard", async ({
    page,
  }) => {
    await page.goto("/dashboard");
    const nav = page.getByRole("navigation", { name: /primary/i });

    await nav.getByRole("link", { name: /android devices/i }).click();
    await expect(page).toHaveURL(/\/devices$/);
    await expect(
      page.getByRole("heading", { level: 1, name: /android devices/i }),
    ).toBeVisible();
    await expect(
      nav.getByRole("link", { name: /android devices/i }),
    ).toHaveAttribute("aria-current", "page");

    await nav.getByRole("link", { name: /^dashboard$/i }).click();
    await expect(page).toHaveURL(/\/dashboard$/);
    await expect(
      page.getByRole("heading", {
        level: 1,
        name: /local node dashboard/i,
      }),
    ).toBeVisible();
  });
});

import { test, expect } from "@playwright/test";

/**
 * Consolidated E2E smoke for the Android Devices workspace.
 *
 * Per `frontend-android-device-management-e2e-smoke` spec, this
 * suite covers the canonical scenarios in a single file so future
 * maintenance has one place to look for the "does the Android
 * Devices workspace still work?" answer:
 *
 *   1. Pending device row is visible and selectable.
 *   2. Device detail aside renders role / binding / policy /
 *      heartbeat / platform sections with canonical token chips.
 *   3. Guarded `Assign` affordance — button disabled with
 *      operator-visible tooltip referencing the upcoming
 *      dedicated UI feature (no fake-success per spec).
 *   4. Policy editor flow: open from active device, see canonical
 *      `disabledCapabilities` (e.g. `diagnostics` token), toggle
 *      a non-critical capability, save — `policyVersion` bumps
 *      in the detail aside.
 *   5. Guarded `Retire` affordance — button disabled with
 *      operator-visible tooltip referencing the upcoming
 *      dedicated UI feature.
 *   6. Degraded-state e2e (mock scenario `service-degraded`)
 *      is bound to the playwright build env; covered at the
 *      unit / component layer (`live-android-devices-loader.test.ts`
 *      verifies 503 ANDROID_DEVICE_NOT_IMPLEMENTED → ApiError
 *      propagation) and tracked as a separate cross-scope e2e
 *      feature (`android-device-registration-local-node-e2e`).
 *
 * The playwright build is baked with `NEXT_PUBLIC_API_ADAPTER=mock`
 * and `NEXT_PUBLIC_MOCK_SCENARIO=normal`, so this suite runs
 * against the default mock fixture set; live transport is covered
 * at the unit layer.
 */

const DESKTOP = { width: 1440, height: 900 } as const;

test.use({ viewport: DESKTOP });

test.describe("android devices management e2e smoke", () => {
  test("pending device is visible in the list and on the default selection", async ({
    page,
  }) => {
    await page.goto("/devices");
    await expect(
      page.getByRole("heading", { level: 1, name: /android devices/i }),
    ).toBeVisible();

    // Default scenario seeds a pending device (AD-7F02-PEND).
    const pendingRow = page
      .getByRole("button", { name: /AD-7F02-PEND/ })
      .first();
    await expect(pendingRow).toBeVisible();

    // Default selection points at the first row (pending).
    const detail = page.getByRole("complementary", {
      name: /Device AD-7F02-PEND/i,
    });
    await expect(detail).toBeVisible();

    // Pending filter narrows the list.
    await page.getByRole("tab", { name: /^pending$/i }).click();
    await expect(
      page.getByRole("tab", { name: /^pending$/i }),
    ).toHaveAttribute("aria-selected", "true");
    await expect(
      page.getByRole("button", { name: /AD-7F02-PEND/ }).first(),
    ).toBeVisible();
  });

  test("device detail aside renders role + binding + policy + heartbeat + platform", async ({
    page,
  }) => {
    await page.goto("/devices");
    // Switch to an active registrar device (richer detail aside).
    await page.getByRole("button", { name: /AD-3A11-REG/ }).first().click();
    const detail = page.getByRole("complementary", {
      name: /Device AD-3A11-REG/i,
    });

    await expect(detail.getByText(/Role & binding/i)).toBeVisible();
    await expect(detail.getByText(/Capability policy/i)).toBeVisible();
    await expect(detail.getByText(/Heartbeat/i)).toBeVisible();
    await expect(detail.getByText(/Platform/i)).toBeVisible();

    // Canonical names visible as tokens.
    await expect(detail.getByText("registrar", { exact: true })).toBeVisible();
    await expect(detail.getByText(/policyVersion/i)).toBeVisible();
    await expect(detail.getByText(/disabledCapabilities/i)).toBeVisible();
    // The default fixture disables `diagnostics` on AD-3A11-REG.
    await expect(
      detail.getByText("diagnostics", { exact: true }),
    ).toBeVisible();
  });

  test("guarded assign affordance: disabled with operator tooltip", async ({
    page,
  }) => {
    await page.goto("/devices");
    await page.getByRole("button", { name: /AD-3A11-REG/ }).first().click();
    const detail = page.getByRole("complementary", {
      name: /Device AD-3A11-REG/i,
    });
    const assign = detail.getByRole("button", { name: /^assign$/i });
    await expect(assign).toBeVisible();
    await expect(assign).toBeDisabled();
    // Tooltip references the upcoming dedicated UI feature
    // (per spec "не притворяться live success").
    await expect(assign).toHaveAttribute(
      "title",
      /upcoming|integration feature/i,
    );
  });

  test("policy editor flow: open active device editor, see canonical chip, save bumps policyVersion", async ({
    page,
  }) => {
    await page.goto("/devices");
    // AD-5C82-REG starts at v2 with empty disabledCapabilities —
    // toggling diagnostics is non-critical (no safe-confirm).
    await page.getByRole("button", { name: /AD-5C82-REG/ }).first().click();
    const detail = page.getByRole("complementary", {
      name: /Device AD-5C82-REG/i,
    });
    await expect(detail.getByText(/^v2$/)).toBeVisible();

    await detail.getByRole("button", { name: /edit policy/i }).click();
    const editor = page.getByRole("dialog", {
      name: /Edit capability policy · AD-5C82-REG/i,
    });
    await expect(editor).toBeVisible();
    // Canonical capability token visible in the editor list.
    await expect(
      editor.getByText("diagnostics", { exact: true }),
    ).toBeVisible();
    // The current policyVersion is shown read-only.
    await expect(editor.getByText(/^v2$/)).toBeVisible();

    await editor.getByLabel(/diagnostics/i).check();
    await editor.getByRole("button", { name: /^save$/i }).click();

    // policyVersion bumps in detail aside.
    const after = page.getByRole("complementary", {
      name: /Device AD-5C82-REG/i,
    });
    await expect(after.getByText(/^v3$/)).toBeVisible();
    // The new disabledCapabilities list now includes diagnostics.
    await expect(
      after.getByText("diagnostics", { exact: true }),
    ).toBeVisible();
  });

  test("policy editor: safe-confirm fires for critical capability disable", async ({
    page,
  }) => {
    await page.goto("/devices");
    await page.getByRole("button", { name: /AD-5C82-REG/ }).first().click();
    const detail = page.getByRole("complementary", {
      name: /Device AD-5C82-REG/i,
    });
    await detail.getByRole("button", { name: /edit policy/i }).click();
    const editor = page.getByRole("dialog", {
      name: /Edit capability policy · AD-5C82-REG/i,
    });

    // Toggle a critical capability (settings).
    await editor.getByLabel(/runtime settings/i).check();
    await editor.getByRole("button", { name: /^save$/i }).click();

    const confirm = page.getByRole("dialog", {
      name: /confirm policy change/i,
    });
    await expect(confirm).toBeVisible();
    // "Keep editing" returns to the editor without saving.
    await confirm.getByRole("button", { name: /keep editing/i }).click();
    await expect(
      page.getByRole("dialog", {
        name: /Edit capability policy · AD-5C82-REG/i,
      }),
    ).toBeVisible();
  });

  test("guarded retire affordance: disabled with operator tooltip", async ({
    page,
  }) => {
    await page.goto("/devices");
    await page.getByRole("button", { name: /AD-3A11-REG/ }).first().click();
    const detail = page.getByRole("complementary", {
      name: /Device AD-3A11-REG/i,
    });
    const retire = detail.getByRole("button", { name: /^retire$/i });
    await expect(retire).toBeVisible();
    await expect(retire).toBeDisabled();
    await expect(retire).toHaveAttribute(
      "title",
      /upcoming|integration feature/i,
    );

    // For an already-retired device the tooltip switches to
    // "already retired".
    await page.getByRole("button", { name: /AD-2E55-RET/ }).first().click();
    const retiredDetail = page.getByRole("complementary", {
      name: /Device AD-2E55-RET/i,
    });
    const retiredRetire = retiredDetail.getByRole("button", {
      name: /^retire$/i,
    });
    await expect(retiredRetire).toBeDisabled();
    await expect(retiredRetire).toHaveAttribute(
      "title",
      /already retired/i,
    );
  });

  test("retired device locks down policy + retire affordances", async ({
    page,
  }) => {
    await page.goto("/devices");
    await page.getByRole("tab", { name: /^retired$/i }).click();
    await expect(
      page.getByRole("button", { name: /AD-2E55-RET/ }).first(),
    ).toBeVisible();

    const detail = page.getByRole("complementary", {
      name: /Device AD-2E55-RET/i,
    });
    const editPolicy = detail.getByRole("button", { name: /edit policy/i });
    await expect(editPolicy).toBeDisabled();
    await expect(editPolicy).toHaveAttribute("title", /retired/i);

    const retire = detail.getByRole("button", { name: /^retire$/i });
    await expect(retire).toBeDisabled();
    await expect(retire).toHaveAttribute("title", /already retired/i);
  });

  test("mock fallback is default-safe: sidebar lands on /devices without any mock-mode toggle", async ({
    page,
  }) => {
    await page.goto("/dashboard");
    const nav = page.getByRole("navigation", { name: /primary/i });
    await nav.getByRole("link", { name: /android devices/i }).click();
    await expect(page).toHaveURL(/\/devices$/);
    await expect(
      page.getByRole("heading", { level: 1, name: /android devices/i }),
    ).toBeVisible();
    // Default scenario seeds at least one row → table renders without
    // requiring any backend, confirming mock-mode default-safe.
    await expect(
      page.getByRole("button", { name: /AD-/ }).first(),
    ).toBeVisible();
  });
});

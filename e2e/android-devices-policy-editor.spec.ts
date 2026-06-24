import { test, expect } from "@playwright/test";

/**
 * Browser workflow smoke for the Android device capability policy
 * editor (mock-first baseline).
 *
 * Per `frontend-android-device-policy-editor-baseline` spec: the
 * editor lets the operator toggle canonical `disabledCapabilities`,
 * apply role presets (registrar / vehicleVerifier), edit
 * `policyReason`, and safe-confirm critical or disable-all
 * transitions. No live API calls — the editor only mutates local
 * mock state through `useConsoleAndroidDevices.applyPolicyEdit`.
 *
 * Coverage:
 *
 *   - editor opens from the active device detail aside;
 *   - current `policyVersion` is visible in the editor + detail
 *     aside;
 *   - canonical capability tokens render as monospace chips next
 *     to operator-friendly labels;
 *   - applying the registrar preset disables critical capabilities
 *     and surfaces the safe-confirm dialog;
 *   - confirm-and-save bumps `policyVersion` in the detail aside;
 *   - "Cancel" closes the editor without changing the snapshot.
 */

const DESKTOP = { width: 1440, height: 900 } as const;

test.use({ viewport: DESKTOP });

test.describe("android device capability policy editor (mock-mode smoke)", () => {
  test("Edit policy opens the editor with current policyVersion + canonical chips", async ({
    page,
  }) => {
    await page.goto("/devices");

    // Select active registrar device AD-3A11-REG (policyVersion = 4 in
    // the default fixture, with `diagnostics` already disabled).
    await page.getByRole("button", { name: /AD-3A11-REG/ }).first().click();
    const detail = page.getByRole("complementary", {
      name: /Device AD-3A11-REG/i,
    });
    await detail.getByRole("button", { name: /edit policy/i }).click();

    const editor = page.getByRole("dialog", {
      name: /Edit capability policy · AD-3A11-REG/i,
    });
    await expect(editor).toBeVisible();
    await expect(editor.getByText(/^v4$/)).toBeVisible();
    // Canonical capability tokens visible as mono chips. Use exact
    // match so "diagnostics" / "settings" do not also pick up their
    // operator-friendly labels ("Diagnostics" / "Runtime settings").
    await expect(
      editor.getByText("enrollmentCapture", { exact: true }),
    ).toBeVisible();
    await expect(
      editor.getByText("diagnostics", { exact: true }),
    ).toBeVisible();
    await expect(
      editor.getByText("settings", { exact: true }),
    ).toBeVisible();
  });

  test("Cancel closes the editor without mutating the snapshot", async ({
    page,
  }) => {
    await page.goto("/devices");
    await page.getByRole("button", { name: /AD-3A11-REG/ }).first().click();
    const detail = page.getByRole("complementary", {
      name: /Device AD-3A11-REG/i,
    });
    await detail.getByRole("button", { name: /edit policy/i }).click();

    const editor = page.getByRole("dialog", {
      name: /Edit capability policy · AD-3A11-REG/i,
    });
    await expect(editor).toBeVisible();
    await editor.getByRole("button", { name: /^cancel$/i }).click();
    // Detail aside still shows v4.
    await expect(detail.getByText(/^v4$/)).toBeVisible();
  });

  test("Applying registrar preset triggers safe-confirm and confirm-save bumps policyVersion", async ({
    page,
  }) => {
    await page.goto("/devices");
    // Select active registrar device AD-5C82-REG (policyVersion = 2,
    // no disabled capabilities → applying registrar preset newly
    // disables criticals → safe-confirm).
    await page.getByRole("button", { name: /AD-5C82-REG/ }).first().click();
    const detail = page.getByRole("complementary", {
      name: /Device AD-5C82-REG/i,
    });
    await expect(detail.getByText(/^v2$/)).toBeVisible();
    await detail.getByRole("button", { name: /edit policy/i }).click();

    const editor = page.getByRole("dialog", {
      name: /Edit capability policy · AD-5C82-REG/i,
    });
    await editor
      .getByRole("button", { name: /apply registrar preset/i })
      .click();
    await editor.getByRole("button", { name: /^save$/i }).click();

    const confirm = page.getByRole("dialog", {
      name: /confirm policy change/i,
    });
    await expect(confirm).toBeVisible();
    await confirm
      .getByRole("button", { name: "Confirm & save" })
      .click();

    // policyVersion bumped to v3 in detail aside.
    const after = page.getByRole("complementary", {
      name: /Device AD-5C82-REG/i,
    });
    await expect(after.getByText(/^v3$/)).toBeVisible();
  });
});

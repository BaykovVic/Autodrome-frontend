import { test, expect } from "@playwright/test";

/**
 * Browser workflow smoke for Android Devices assign + retire
 * command UI.
 *
 * Per `frontend-android-device-assignment-retire-command-ui` spec:
 * dedicated mock-first dialogs replace the disabled-with-tooltip
 * affordances. Live mode wires the same dialogs to
 * `POST /admin/devices/{deviceId}/assign` /
 * `POST /admin/devices/{deviceId}/retire`; degraded paths are
 * unit-tested. This smoke covers the mock-mode flow that operators
 * see on the default `pnpm e2e` build (mock + normal scenario).
 *
 * Coverage:
 *
 *   - Assign dialog opens from a pending device + canonical
 *     role/binding compatibility validation.
 *   - Save transitions device to active + sets binding +
 *     populates default empty policy.
 *   - Retire dialog opens from an active device + two-step
 *     safe-confirm + transition to retired.
 *   - Retired-state lockdown after success (Edit policy + Retire
 *     disabled; tooltip says "already retired").
 */

const DESKTOP = { width: 1440, height: 900 } as const;

// Canonical UUID v4 anchor (matches the AndroidDeviceBinding.anchorId
// `format: uuid` declaration in the android-device-management
// OpenAPI spec). Used in the assign happy-path test; the negative
// test feeds an operator-friendly label and asserts rejection.
const ANCHOR_UUID = "55555555-5555-4555-8555-555555555555";

test.use({ viewport: DESKTOP });

test.describe("android devices assign + retire command UI (mock-mode smoke)", () => {
  test("Assign dialog: pending → active via canonical role + binding + anchor", async ({
    page,
  }) => {
    await page.goto("/devices");
    await page.getByRole("button", { name: /AD-7F02-PEND/ }).first().click();
    const detail = page.getByRole("complementary", {
      name: /Device AD-7F02-PEND/i,
    });
    await expect(detail.getByText("pending").first()).toBeVisible();

    await detail.getByRole("button", { name: /^assign$/i }).click();
    const dialog = page.getByRole("dialog", {
      name: /Assign Android device · AD-7F02-PEND/i,
    });
    await expect(dialog).toBeVisible();

    await dialog
      .getByLabel(/^role$/i)
      .selectOption("registrar");
    await dialog
      .getByLabel(/binding type/i)
      .selectOption("workstation");
    await dialog.getByLabel(/anchor id/i).fill(ANCHOR_UUID);

    await dialog
      .getByRole("button", { name: /save assignment/i })
      .click();

    // Detail aside reflects active state with new binding.
    const after = page.getByRole("complementary", {
      name: /Device AD-7F02-PEND/i,
    });
    await expect(after.getByText("active").first()).toBeVisible();
    await expect(
      after.getByText(new RegExp(ANCHOR_UUID)).first(),
    ).toBeVisible();
    // Default empty policy stamped: v1.
    await expect(after.getByText(/^v1$/)).toBeVisible();
  });

  test("Assign dialog: validation rejects empty fields", async ({
    page,
  }) => {
    await page.goto("/devices");
    await page.getByRole("button", { name: /AD-7F02-PEND/ }).first().click();
    const detail = page.getByRole("complementary", {
      name: /Device AD-7F02-PEND/i,
    });
    await detail.getByRole("button", { name: /^assign$/i }).click();

    const dialog = page.getByRole("dialog", {
      name: /Assign Android device/i,
    });
    await dialog
      .getByRole("button", { name: /save assignment/i })
      .click();
    // Validation errors render.
    await expect(dialog.getByText(/role is required/i)).toBeVisible();
    await expect(dialog.getByText(/binding type is required/i)).toBeVisible();
    await expect(dialog.getByText(/anchor id is required/i)).toBeVisible();
  });

  test("Assign dialog: rejects non-UUID anchor (R1 canonical contract guard)", async ({
    page,
  }) => {
    await page.goto("/devices");
    await page.getByRole("button", { name: /AD-7F02-PEND/ }).first().click();
    const detail = page.getByRole("complementary", {
      name: /Device AD-7F02-PEND/i,
    });
    await detail.getByRole("button", { name: /^assign$/i }).click();
    const dialog = page.getByRole("dialog", {
      name: /Assign Android device/i,
    });
    await dialog
      .getByLabel(/^role$/i)
      .selectOption("registrar");
    await dialog
      .getByLabel(/binding type/i)
      .selectOption("workstation");
    // Operator-friendly label — canonical AndroidDeviceBinding.anchorId
    // is `format: uuid`, so the UI must reject this before
    // dispatch.
    await dialog.getByLabel(/anchor id/i).fill("WS-PILOT-1");
    await dialog
      .getByRole("button", { name: /save assignment/i })
      .click();
    await expect(
      dialog.getByText(/anchor id must be a canonical uuid/i),
    ).toBeVisible();
    // Device status untouched in the workspace.
    await dialog.getByRole("button", { name: /^cancel$/i }).click();
    const stillPending = page.getByRole("complementary", {
      name: /Device AD-7F02-PEND/i,
    });
    await expect(
      stillPending.getByText("pending").first(),
    ).toBeVisible();
  });

  test("Retire dialog: safe-confirm flow → device retired + lockdown", async ({
    page,
  }) => {
    await page.goto("/devices");
    await page.getByRole("button", { name: /AD-3A11-REG/ }).first().click();
    const detail = page.getByRole("complementary", {
      name: /Device AD-3A11-REG/i,
    });
    await detail.getByRole("button", { name: /^retire$/i }).click();

    const form = page.getByRole("dialog", {
      name: /Retire Android device · AD-3A11-REG/i,
    });
    await expect(form).toBeVisible();
    await form
      .getByLabel(/audit reason/i)
      .fill("Decommissioned for pilot rotation");
    await form.getByRole("button", { name: /retire device/i }).click();

    const confirm = page.getByRole("dialog", {
      name: /confirm retire/i,
    });
    await expect(confirm).toBeVisible();
    await expect(
      confirm.getByText(/decommissioned for pilot rotation/i),
    ).toBeVisible();
    await confirm
      .getByRole("button", { name: /confirm.*retire/i })
      .click();

    // Detail aside reflects retired state + locked affordances.
    const after = page.getByRole("complementary", {
      name: /Device AD-3A11-REG/i,
    });
    await expect(after.getByText("retired").first()).toBeVisible();
    await expect(
      after.getByRole("button", { name: /edit policy/i }),
    ).toBeDisabled();
    const retireBtn = after.getByRole("button", { name: /^retire$/i });
    await expect(retireBtn).toBeDisabled();
    await expect(retireBtn).toHaveAttribute("title", /already retired/i);
  });

  test("Retire dialog: Keep editing returns to reason form without saving", async ({
    page,
  }) => {
    await page.goto("/devices");
    await page.getByRole("button", { name: /AD-5C82-REG/ }).first().click();
    const detail = page.getByRole("complementary", {
      name: /Device AD-5C82-REG/i,
    });
    await detail.getByRole("button", { name: /^retire$/i }).click();
    await page
      .getByRole("dialog", { name: /Retire Android device/i })
      .getByRole("button", { name: /retire device/i })
      .click();
    const confirm = page.getByRole("dialog", {
      name: /confirm retire/i,
    });
    await confirm
      .getByRole("button", { name: /keep editing/i })
      .click();

    // Reason form view is back.
    await expect(
      page.getByRole("dialog", {
        name: /Retire Android device · AD-5C82-REG/i,
      }),
    ).toBeVisible();
    // Device still active in detail aside (no mutation).
    const stillActive = page.getByRole("complementary", {
      name: /Device AD-5C82-REG/i,
    });
    await expect(stillActive.getByText("active").first()).toBeVisible();
  });
});

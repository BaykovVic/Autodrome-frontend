import { test, expect } from "@playwright/test";

const DESKTOP = { width: 1440, height: 900 } as const;

/**
 * The e2e build runs with `NEXT_PUBLIC_MOCK_SCENARIO=normal`, whose
 * session actor is an admin holding `user.read`, `audit.read` and
 * `user.assign`. These smokes assert the role-aware navigation and
 * command gating do NOT hide admin-scoped surfaces from an admin
 * (role differences for operator/auditor are covered by unit tests,
 * since the e2e build has a single baked-in scenario).
 */
test.describe("rbac role-aware navigation (mock admin session)", () => {
  test.use({ viewport: DESKTOP });

  test("admin session surfaces Security + Audit nav entries", async ({
    page,
  }) => {
    await page.goto("/dashboard");
    await expect(
      page.getByRole("link", { name: /^security$/i }).first(),
    ).toBeVisible();
    await expect(
      page.getByRole("link", { name: /^audit$/i }).first(),
    ).toBeVisible();
  });

  test("admin session surfaces the role-management command", async ({
    page,
  }) => {
    await page.goto("/security");
    // Admin holds user.assign → the assign command renders (disabled
    // by the backend gap, but present rather than permission-gated).
    await expect(
      page.getByRole("button", { name: /^assign$/i }).first(),
    ).toBeVisible();
  });
});

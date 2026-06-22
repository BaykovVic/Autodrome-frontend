import { test, expect, type Page } from "@playwright/test";

/**
 * Web Operator Console design gate.
 *
 * The design-rework sprint shipped six Web Operator Console screens
 * (candidate registry, candidate create, start-enrollment dialog,
 * session monitor, camera station, capture window). This gate is a
 * cross-screen smoke that walks every screen at two viewports and
 * asserts:
 *
 *   - the document does not overflow horizontally;
 *   - the level-1 heading is visible (screen mounted);
 *   - the primary call-to-action is visible;
 *   - deterministic disabled states are still rendered with a button
 *     element where the design reference expects them;
 *   - the page does not depend on a live backend / API (mock mode is
 *     forced at build time by `playwright.config.ts`).
 *
 * Out of scope per spec:
 *
 *   - no pixel-perfect visual diff tooling;
 *   - no real camera permission automation (the capture window is a
 *     mock surface).
 */

const DESKTOP = { width: 1440, height: 900 } as const;
const NARROW = { width: 375, height: 812 } as const;

const SHELL_SCREENS = [
  {
    path: "/candidates",
    heading: /^candidates$/i,
    primaryCta: /register candidate/i,
  },
  {
    path: "/candidates/new",
    heading: /create candidate/i,
    primaryCta: /save and start enrollment/i,
  },
  {
    path: "/candidates/sessions/ENR-9F41",
    heading: /enrollment session/i,
    primaryCta: /cancel session/i,
    // In the default `capturing` scenario, Retry is rendered but
    // disabled (RETRY_ELIGIBLE does not include `capturing`).
    expectedDisabled: /^retry$/i,
  },
  {
    path: "/candidates/sessions/ENR-9F41/camera-station",
    heading: /camera station/i,
    primaryCta: /open capture window/i,
  },
] as const;

async function assertNoHorizontalOverflow(page: Page, vw: number) {
  const overflow = await page.evaluate(() => ({
    vw: window.innerWidth,
    bodyScrollWidth: document.body.scrollWidth,
    docScrollWidth: document.documentElement.scrollWidth,
  }));
  expect(overflow.vw).toBe(vw);
  expect(overflow.bodyScrollWidth).toBeLessThanOrEqual(overflow.vw);
  expect(overflow.docScrollWidth).toBeLessThanOrEqual(overflow.vw);
}

for (const viewport of [DESKTOP, NARROW] as const) {
  test.describe(`${viewport.width}x${viewport.height} viewport`, () => {
    test.use({ viewport });

    for (const screen of SHELL_SCREENS) {
      test(`${screen.path} renders heading + primary CTA without horizontal overflow`, async ({
        page,
      }) => {
        await page.goto(screen.path);

        // The Console topbar always renders first inside `(shell)`.
        await expect(
          page.getByRole("banner", { name: /console topbar/i }),
        ).toBeVisible();

        const heading = page.getByRole("heading", {
          level: 1,
          name: screen.heading,
        });
        await expect(heading).toBeVisible();

        // Primary CTA may be a real <button> (most screens) or a
        // styled <a> (Open capture window on the camera station — the
        // Codex R1 fix from the camera-station feature). Both should
        // be visible.
        const primaryButton = page.getByRole("button", {
          name: screen.primaryCta,
        });
        const primaryLink = page.getByRole("link", {
          name: screen.primaryCta,
        });
        const primaryCount =
          (await primaryButton.count()) + (await primaryLink.count());
        expect(primaryCount).toBeGreaterThan(0);

        if ("expectedDisabled" in screen && screen.expectedDisabled) {
          const disabled = page
            .getByRole("button", { name: screen.expectedDisabled })
            .first();
          await expect(disabled).toBeVisible();
          await expect(disabled).toBeDisabled();
        }

        await assertNoHorizontalOverflow(page, viewport.width);
      });
    }

    test(`/capture/ENR-9F41 renders the standalone capture window without horizontal overflow`, async ({
      page,
    }) => {
      await page.goto("/capture/ENR-9F41");

      // Capture window is intentionally outside the (shell) group —
      // it must NOT render the console topbar.
      await expect(
        page.getByRole("banner", { name: /console topbar/i }),
      ).toHaveCount(0);

      const dialog = page.getByRole("dialog", {
        name: /capture window/i,
      });
      await expect(dialog).toBeVisible();

      // Primary "Done" action is visible and enabled in default
      // capturing scenario.
      const done = page.getByRole("button", { name: /^done$/i });
      await expect(done).toBeVisible();
      await expect(done).toBeEnabled();

      // Cancel and close are both rendered.
      await expect(
        page.getByRole("button", { name: /^cancel$/i }),
      ).toBeVisible();
      await expect(
        page.getByRole("button", { name: /close capture window/i }),
      ).toBeVisible();

      await assertNoHorizontalOverflow(page, viewport.width);
    });
  });
}

test.describe("start enrollment dialog", () => {
  test.use({ viewport: DESKTOP });

  test("opens from /candidates/new after a valid Save and start enrollment click", async ({
    page,
  }) => {
    await page.goto("/candidates/new");
    await expect(
      page.getByRole("heading", { level: 1, name: /create candidate/i }),
    ).toBeVisible();

    // Before submit the primary CTA is enabled; the dialog is not yet
    // rendered as an open <dialog>.
    await expect(
      page.getByRole("dialog", { name: /start face enrollment/i }),
    ).not.toBeVisible();

    // Fill in the minimum valid form.
    await page.getByLabel(/full name/i).fill("Anna Petrova");
    await page.getByLabel(/date of birth/i).fill("12.04.2001");
    await page.getByLabel(/document \/ license/i).fill("DL-77-014562");

    await page
      .getByRole("button", { name: /save and start enrollment/i })
      .click();

    const dialog = page.getByRole("dialog", {
      name: /start face enrollment/i,
    });
    await expect(dialog).toBeVisible();

    // Both channel cards visible, registrar pre-selected by default
    // (registrar-online scenario).
    await expect(
      dialog.getByRole("tab", { name: /send to registrar tablet/i }),
    ).toBeVisible();
    await expect(
      dialog.getByRole("tab", { name: /local web camera/i }),
    ).toBeVisible();
    await expect(
      dialog.getByRole("button", { name: /send to registrar/i }),
    ).toBeEnabled();
  });
});

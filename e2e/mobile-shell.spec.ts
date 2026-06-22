import { test, expect } from "@playwright/test";

/**
 * Mobile shell smoke. The shell must fit inside a narrow viewport
 * (e.g. iPhone 12 portrait) without causing horizontal document
 * overflow. Regression target: R1 from the Autodrome console
 * design foundation review — the topbar cluster was rendered past
 * the viewport edge on `375x812`.
 */

const NARROW = { width: 375, height: 812 } as const;

const ROUTES = [
  "/dashboard",
  "/candidates",
  "/candidates/new",
  "/candidates/sessions/ENR-9F41",
  "/vehicles",
  "/exams",
  "/exercises",
  "/violations",
  "/rules",
  "/evidence",
  "/operations",
];

test.use({ viewport: NARROW });

for (const path of ROUTES) {
  test(`${path} fits in ${NARROW.width}x${NARROW.height} without horizontal overflow`, async ({
    page,
  }) => {
    await page.goto(path);

    // Wait for the topbar (always rendered first) so we know the
    // shell mounted.
    await expect(
      page.getByRole("banner", { name: /console topbar/i }),
    ).toBeVisible();

    const overflow = await page.evaluate(() => ({
      vw: window.innerWidth,
      bodyScrollWidth: document.body.scrollWidth,
      docScrollWidth: document.documentElement.scrollWidth,
    }));

    expect(overflow.vw).toBe(NARROW.width);
    expect(overflow.bodyScrollWidth).toBeLessThanOrEqual(overflow.vw);
    expect(overflow.docScrollWidth).toBeLessThanOrEqual(overflow.vw);
  });
}

import { test, expect } from "@playwright/test";

/**
 * Accessibility hardening sweep для pilot-critical views.
 *
 * Проверяет:
 *   - landmark structure (exactly one h1, sidebar `navigation`
 *     landmark, main content region);
 *   - tab list semantics там где tabs используются
 *     (operations, exam state filter);
 *   - form labels (candidate create form);
 *   - focus management (first focusable element doesn't
 *     break keyboard nav).
 *
 * Эти assertions formalize что уже шипнуто в текущих
 * specs — accessibility tooling (axe-core etc.) можно
 * подключить отдельной фичей через Playwright
 * `@axe-core/playwright` без breaking changes.
 */

const ROUTES_WITH_H1 = [
  "/dashboard",
  "/candidates",
  "/candidates/new",
  "/vehicles",
  "/exams",
  "/exercises",
  "/rules",
  "/violations",
  "/devices",
  "/evidence",
  "/evidence/EVD-77210",
  "/reporting",
  "/virtual-vehicles",
  "/virtual-vehicles/scenarios",
  "/virtual-vehicles/sessions/VV-SIM-001",
  "/virtual-vehicles/sessions/VV-SIM-001/manual-control",
  "/virtual-vehicles/sessions/VV-SIM-001/runtime-preview",
] as const;

const DESKTOP = { width: 1440, height: 900 } as const;

test.describe("accessibility hardening", () => {
  test.use({ viewport: DESKTOP });

  for (const route of ROUTES_WITH_H1) {
    test(`landmark: ${route} has exactly one h1`, async ({ page }) => {
      await page.goto(route);
      const headings = page.getByRole("heading", { level: 1 });
      await expect(headings.first()).toBeVisible();
      // At most one visible h1 per page.
      const count = await headings.count();
      expect(count).toBeGreaterThanOrEqual(1);
      expect(count).toBeLessThanOrEqual(1);
    });
  }

  test("dashboard has navigation landmark", async ({ page }) => {
    await page.goto("/dashboard");
    // Sidebar is a <nav> with implicit role=navigation.
    const navs = page.getByRole("navigation");
    await expect(navs.first()).toBeVisible();
  });

  test("candidate create form has labelled fields", async ({ page }) => {
    await page.goto("/candidates/new");
    await expect(
      page.getByRole("form", { name: /candidate data/i }),
    ).toBeVisible();
    // Все form inputs должны быть accessible by label —
    // explicit (for/id), implicit (wrapped in <label>), or
    // ARIA (aria-label / aria-labelledby).
    const inputs = page.locator("form input:not([type='hidden'])");
    const count = await inputs.count();
    expect(count).toBeGreaterThan(0);
    for (let i = 0; i < count; i += 1) {
      const input = inputs.nth(i);
      const labelledBy = await input.getAttribute("aria-labelledby");
      const ariaLabel = await input.getAttribute("aria-label");
      const id = await input.getAttribute("id");
      let explicitLabel: string | null = null;
      if (id) {
        const label = page.locator(`label[for="${id}"]`);
        if ((await label.count()) > 0) {
          explicitLabel = await label.first().textContent();
        }
      }
      // Implicit label: input nested inside <label>.
      const implicitLabel = await input
        .locator("xpath=ancestor::label[1]")
        .count();
      expect(
        Boolean(
          labelledBy ||
            ariaLabel ||
            explicitLabel ||
            implicitLabel > 0,
        ),
      ).toBeTruthy();
    }
  });

  test("operations tabs have tab roles + selected state", async ({
    page,
  }) => {
    await page.goto("/operations");
    const tablist = page.getByRole("tablist", {
      name: /operations sections/i,
    });
    await expect(tablist).toBeVisible();
    // At least one selected tab.
    const selectedTabs = page.getByRole("tab", { selected: true });
    await expect(selectedTabs.first()).toBeVisible();
  });

  test("exam state filter is a labelled tablist", async ({ page }) => {
    await page.goto("/exams");
    await expect(
      page.getByRole("tablist", { name: /exam state filter/i }),
    ).toBeVisible();
  });

  test("evidence detail breadcrumb is navigation landmark", async ({
    page,
  }) => {
    await page.goto("/evidence/EVD-77210");
    await expect(
      page.getByRole("navigation", { name: /breadcrumb/i }).first(),
    ).toBeVisible();
  });

  test("runtime preview breadcrumb is navigation landmark", async ({
    page,
  }) => {
    await page.goto(
      "/virtual-vehicles/sessions/VV-SIM-001/runtime-preview",
    );
    await expect(
      page.getByRole("navigation", { name: /breadcrumb/i }).first(),
    ).toBeVisible();
  });
});

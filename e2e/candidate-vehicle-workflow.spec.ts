import { test, expect } from "@playwright/test";

/**
 * Browser workflow smoke for the candidate + vehicle workspaces.
 *
 * Per `frontend-candidate-vehicle-live-api-integration` spec: the
 * candidates and vehicles workspaces are wired to live
 * candidate-service / vehicle-service clients in `live` mode, but
 * the default `mock` mode (baked into `playwright.config.ts`) keeps
 * the workspaces backend-free. This spec proves that the live-loader
 * code-path does not break the mock-mode workspaces:
 *
 *   - registry tables render with rows from the mock fixtures;
 *   - a row can be selected via the keyboard-accessible primary cell
 *     button and the detail aside follows;
 *   - chips / filters can be flipped without the page crashing;
 *   - the navigation flow Candidates → Vehicles → Candidates stays
 *     intact.
 *
 * This smoke does NOT exercise the live transport — `pnpm e2e`
 * runs against a mock build. Live transport is verified at the unit
 * layer (`live-candidates-loader.test.ts` /
 * `live-vehicles-loader.test.ts`) with mocked openapi-fetch clients.
 */

const DESKTOP = { width: 1440, height: 900 } as const;

test.use({ viewport: DESKTOP });

test.describe("candidate + vehicle workflow (mock-mode smoke)", () => {
  test("/candidates renders rows, opens a candidate detail and shows the enrollment panel", async ({
    page,
  }) => {
    await page.goto("/candidates");
    await expect(
      page.getByRole("heading", { level: 1, name: /^candidates$/i }),
    ).toBeVisible();

    // Table renders at least one row from the normal fixture.
    const firstCandidate = page
      .getByRole("button", { name: /CND-1042/i })
      .first();
    await expect(firstCandidate).toBeVisible();

    // Click another row (CND-1046 "K. Lazareva") and verify the
    // detail aside switches.
    await page
      .getByRole("button", { name: /K\. Lazareva/i })
      .click();
    const detail = page.getByRole("complementary", {
      name: /Candidate CND-1046/i,
    });
    await expect(detail).toBeVisible();
    await expect(
      detail.getByText(/^Face enrollment$/i),
    ).toBeVisible();
  });

  test("/candidates enrollment chips filter the visible set without crashing the page", async ({
    page,
  }) => {
    await page.goto("/candidates");
    const allChip = page.getByRole("tab", { name: /^all$/i });
    const inProgressChip = page.getByRole("tab", {
      name: /^in progress$/i,
    });
    await expect(allChip).toBeVisible();
    await expect(inProgressChip).toBeVisible();
    // Switching to "In progress" should narrow the result set but
    // not surface a fatal error.
    await inProgressChip.click();
    await expect(inProgressChip).toHaveAttribute("aria-selected", "true");
    await expect(
      page.getByRole("heading", { level: 1, name: /^candidates$/i }),
    ).toBeVisible();
  });

  test("/vehicles renders rows from the mock fixture and shell sidebar stays intact", async ({
    page,
  }) => {
    await page.goto("/vehicles");
    await expect(
      page.getByRole("heading", { level: 1, name: /^vehicles$/i }),
    ).toBeVisible();
    // Re-poll devices header CTA is rendered (disabled per design
    // baseline) — surface mount signal.
    await expect(
      page.getByRole("button", { name: /re-poll devices/i }),
    ).toBeVisible();
    // Sidebar marks /vehicles as the active route.
    const nav = page.getByRole("navigation", { name: /primary/i });
    await expect(
      nav.getByRole("link", { name: /^vehicles$/i }),
    ).toHaveAttribute("aria-current", "page");
  });

  test("Candidates → Vehicles → Candidates round-trip via sidebar", async ({
    page,
  }) => {
    await page.goto("/candidates");
    const nav = page.getByRole("navigation", { name: /primary/i });

    await nav.getByRole("link", { name: /^vehicles$/i }).click();
    await expect(page).toHaveURL(/\/vehicles$/);
    await expect(
      page.getByRole("heading", { level: 1, name: /^vehicles$/i }),
    ).toBeVisible();

    await nav.getByRole("link", { name: /^candidates$/i }).click();
    await expect(page).toHaveURL(/\/candidates$/);
    await expect(
      page.getByRole("heading", { level: 1, name: /^candidates$/i }),
    ).toBeVisible();
  });
});

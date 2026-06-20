import { describe, expect, it } from "vitest";
import {
  fireEvent,
  render,
  screen,
  waitForElementToBeRemoved,
} from "@testing-library/react";

import { createMockAdapter } from "@/api/mock/adapter";
import { RuleWorkspace } from "@/app/(shell)/rules/_components/RuleWorkspace";

async function renderWorkspace(
  scenario: Parameters<typeof createMockAdapter>[0],
) {
  const api = createMockAdapter(scenario);
  render(<RuleWorkspace api={api} />);
  await waitForElementToBeRemoved(
    () => screen.queryByRole("status", { name: /loading rules/i }),
    { timeout: 2000 },
  );
}

describe("RuleWorkspace", () => {
  it("renders catalog rows for the normal scenario", async () => {
    await renderWorkspace("normal");
    expect(
      screen.getByRole("heading", { level: 1, name: /^rules$/i }),
    ).toBeDefined();
    expect(await screen.findByText(/Showing 2 of 2/i)).toBeDefined();
    // Rule short id button is rendered as the first column action.
    const idButtons = await screen.findAllByRole("button", {
      name: /60000000…/,
    });
    expect(idButtons.length).toBeGreaterThan(0);
  });

  it("filters by status (draft)", async () => {
    await renderWorkspace("violations-detected");
    await screen.findByText(/Showing 3 of 3/i);
    const statusSelect = screen.getByRole("combobox", {
      name: /^status$/i,
    }) as HTMLSelectElement;
    fireEvent.change(statusSelect, { target: { value: "draft" } });
    expect(screen.getByText(/Showing 1 of 3/i)).toBeDefined();
  });

  it("filters by violation id substring", async () => {
    await renderWorkspace("violations-detected");
    await screen.findByText(/Showing 3 of 3/i);
    const violationInput = screen.getByRole("textbox", {
      name: /violation id/i,
    }) as HTMLInputElement;
    fireEvent.change(violationInput, {
      target: { value: "00000003" },
    });
    expect(screen.getByText(/Showing 1 of 3/i)).toBeDefined();
  });

  it("opens detail panel with status, version and conditions section", async () => {
    await renderWorkspace("normal");
    const idButtons = await screen.findAllByRole("button", {
      name: /60000000…/,
    });
    fireEvent.click(idButtons[0]);

    expect(
      screen.getByRole("complementary", {
        name: /Rule 60000000-/i,
      }),
    ).toBeDefined();
    // Fixture rules have no conditionTree → empty state copy.
    expect(
      screen.getByText(/No conditions defined/i),
    ).toBeDefined();
  });

  it("renders empty state for empty scenario", async () => {
    await renderWorkspace("empty");
    expect(
      await screen.findByText(/No rules in this scenario/i),
    ).toBeDefined();
  });

  it("renders degraded banner for service-degraded scenario for rules list", async () => {
    // service-degraded only fails vehicle-service. Rules still load.
    // This test guards that the rule workspace does not falsely degrade.
    await renderWorkspace("service-degraded");
    expect(screen.queryByText(/service degraded/i)).toBeNull();
  });
});

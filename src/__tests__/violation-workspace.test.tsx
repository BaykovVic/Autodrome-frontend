import { describe, expect, it } from "vitest";
import {
  fireEvent,
  render,
  screen,
  waitForElementToBeRemoved,
} from "@testing-library/react";

import { createMockAdapter } from "@/api/mock/adapter";
import { ViolationWorkspace } from "@/app/(shell)/violations/_components/ViolationWorkspace";

async function renderWorkspace(
  scenario: Parameters<typeof createMockAdapter>[0],
) {
  const api = createMockAdapter(scenario);
  render(<ViolationWorkspace api={api} />);
  await waitForElementToBeRemoved(
    () => screen.queryByRole("status", { name: /loading violations/i }),
    { timeout: 2000 },
  );
}

describe("ViolationWorkspace", () => {
  it("renders catalog rows for the normal scenario", async () => {
    await renderWorkspace("normal");
    expect(
      screen.getByRole("heading", { level: 1, name: /violations/i }),
    ).toBeDefined();
    expect(
      await screen.findByText(/Showing 2 of 2/i),
    ).toBeDefined();
    const codeButtons = await screen.findAllByRole("button", {
      name: /STOP_LINE_CROSSED/,
    });
    expect(codeButtons.length).toBeGreaterThan(0);
  });

  it("filters by severity", async () => {
    await renderWorkspace("violations-detected");
    await screen.findByText(/Showing 3 of 3/i);
    const severitySelect = screen.getByRole("combobox", {
      name: /^severity$/i,
    }) as HTMLSelectElement;
    fireEvent.change(severitySelect, { target: { value: "critical" } });
    expect(screen.getByText(/Showing 1 of 3/i)).toBeDefined();
  });

  it("opens detail panel with active rule version placeholder", async () => {
    await renderWorkspace("normal");
    const buttons = await screen.findAllByRole("button", {
      name: /STOP_LINE_CROSSED/,
    });
    fireEvent.click(buttons[0]);

    expect(
      screen.getByRole("complementary", {
        name: /Violation STOP_LINE_CROSSED/i,
      }),
    ).toBeDefined();
    // No active rule version on fixture violations → EmptyState.
    expect(
      screen.getByText(/No active rule version/i),
    ).toBeDefined();
  });

  it("renders empty state for empty scenario", async () => {
    await renderWorkspace("empty");
    expect(
      await screen.findByText(/No violations in this scenario/i),
    ).toBeDefined();
  });
});

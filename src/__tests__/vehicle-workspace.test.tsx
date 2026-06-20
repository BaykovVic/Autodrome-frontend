import { describe, expect, it } from "vitest";
import {
  fireEvent,
  render,
  screen,
  waitForElementToBeRemoved,
} from "@testing-library/react";

import { createMockAdapter } from "@/api/mock/adapter";
import { VehicleWorkspace } from "@/app/(shell)/vehicles/_components/VehicleWorkspace";

async function renderWorkspace(
  scenario: Parameters<typeof createMockAdapter>[0],
) {
  const api = createMockAdapter(scenario);
  render(<VehicleWorkspace api={api} />);
  await waitForElementToBeRemoved(
    () => screen.queryByRole("status", { name: /loading vehicles/i }),
    { timeout: 2000 },
  );
}

describe("VehicleWorkspace", () => {
  it("renders fleet rows for the normal scenario", async () => {
    await renderWorkspace("normal");
    expect(
      screen.getByRole("heading", { level: 1, name: /vehicles/i }),
    ).toBeDefined();
    expect(screen.getByText("A123BC77")).toBeDefined();
    expect(screen.getByText("T567FG77")).toBeDefined();
    expect(screen.getByText(/Showing 3 of 3/i)).toBeDefined();
  });

  it("narrows list when filtering by type", async () => {
    await renderWorkspace("normal");
    const typeSelect = screen.getByLabelText(
      /^vehicle type$/i,
    ) as HTMLSelectElement;
    fireEvent.change(typeSelect, { target: { value: "truck" } });

    expect(screen.queryByText("A123BC77")).toBeNull();
    expect(screen.getByText("T567FG77")).toBeDefined();
    expect(screen.getByText(/Showing 1 of 3/i)).toBeDefined();
  });

  it("opens the detail panel with telemetry placeholder", async () => {
    await renderWorkspace("normal");
    fireEvent.click(screen.getByRole("button", { name: "A123BC77" }));

    expect(
      screen.getByRole("complementary", { name: /Vehicle A123BC77/i }),
    ).toBeDefined();
    expect(screen.getByText(/Telemetry placeholder/i)).toBeDefined();
  });

  it("renders DegradedState for service-degraded scenario", async () => {
    await renderWorkspace("service-degraded");
    const alerts = screen.getAllByRole("alert");
    const degraded = alerts.find((node) =>
      node.textContent?.includes("vehicle-service"),
    );
    expect(degraded).toBeDefined();
  });

  it("renders EmptyState in the empty scenario", async () => {
    await renderWorkspace("empty");
    expect(
      screen.getByText(/No vehicles in this scenario/i),
    ).toBeDefined();
    expect(screen.getByText(/Showing 0 of 0/i)).toBeDefined();
  });
});

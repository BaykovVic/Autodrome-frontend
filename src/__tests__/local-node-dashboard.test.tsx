import { describe, expect, it } from "vitest";
import {
  render,
  screen,
  waitForElementToBeRemoved,
} from "@testing-library/react";

import { createMockAdapter } from "@/api/mock/adapter";
import { LocalNodeDashboard } from "@/app/(shell)/dashboard/_components/LocalNodeDashboard";

async function renderDashboard(
  scenario: Parameters<typeof createMockAdapter>[0],
) {
  const api = createMockAdapter(scenario);
  render(<LocalNodeDashboard api={api} nodeId="node-test" />);
  await waitForElementToBeRemoved(
    () => screen.queryByRole("status", { name: /loading/i }),
    { timeout: 2000 },
  );
}

describe("LocalNodeDashboard", () => {
  it("renders local node title and aggregate cards for the normal scenario", async () => {
    await renderDashboard("normal");
    expect(
      screen.getByRole("heading", { level: 1, name: /local node/i }),
    ).toBeDefined();

    const cardHeadings = screen
      .getAllByRole("heading", { level: 3 })
      .map((node) => node.textContent);
    expect(cardHeadings).toEqual(
      expect.arrayContaining([
        "Services",
        "Exams",
        "Vehicles",
        "Candidates",
        "Violations",
        "Configuration",
        "Media archive",
        "Offline / local",
      ]),
    );

    expect(screen.getByText(/all services ok/i)).toBeDefined();
  });

  it("shows DegradedState for vehicle-service in the service-degraded scenario", async () => {
    await renderDashboard("service-degraded");
    const alerts = screen.getAllByRole("alert");
    const degradedAlert = alerts.find((node) =>
      node.textContent?.includes("vehicle-service"),
    );
    expect(degradedAlert).toBeDefined();
    expect(screen.getByText(/1 degraded/i)).toBeDefined();
  });

  it("shows zero counters across the empty scenario", async () => {
    await renderDashboard("empty");
    const zeros = screen.getAllByText("0");
    expect(zeros.length).toBeGreaterThan(0);
    expect(screen.getByText(/all services ok/i)).toBeDefined();
  });
});

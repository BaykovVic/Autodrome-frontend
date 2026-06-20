import { describe, expect, it } from "vitest";
import {
  fireEvent,
  render,
  screen,
  waitForElementToBeRemoved,
} from "@testing-library/react";

import { ApiError } from "@/api/errors";
import { ServiceHealthDashboard } from "@/app/(shell)/operations/_components/ServiceHealthDashboard";
import { serviceHealthFor } from "@/app/(shell)/operations/_components/serviceHealthFixtures";
import type { MockScenario } from "@/api/mock/scenarios";

function scenarioLoader(scenario: MockScenario) {
  return () => serviceHealthFor(scenario);
}

async function renderWith(loader: () => unknown) {
  render(<ServiceHealthDashboard loader={loader as never} />);
  if (
    screen.queryByRole("status", { name: /loading service health/i })
  ) {
    await waitForElementToBeRemoved(
      () =>
        screen.queryByRole("status", {
          name: /loading service health/i,
        }),
      { timeout: 2000 },
    );
  }
}

describe("ServiceHealthDashboard", () => {
  it("renders services for the normal scenario", async () => {
    await renderWith(scenarioLoader("normal"));
    expect(
      screen.getByRole("heading", { level: 1, name: /^operations$/i }),
    ).toBeDefined();
    expect(await screen.findByText(/Showing 10 of 10/i)).toBeDefined();
    expect(
      await screen.findAllByRole("button", { name: /Candidate service/i }),
    ).toBeDefined();
  });

  it("filters by liveness (down)", async () => {
    await renderWith(scenarioLoader("service-degraded"));
    await screen.findByText(/Showing 10 of 10/i);
    const livenessSelect = screen.getByRole("combobox", {
      name: /^liveness$/i,
    }) as HTMLSelectElement;
    fireEvent.change(livenessSelect, { target: { value: "down" } });
    expect(screen.getByText(/Showing 1 of 10/i)).toBeDefined();
  });

  it("filters by kind (edge)", async () => {
    await renderWith(scenarioLoader("normal"));
    await screen.findByText(/Showing 10 of 10/i);
    const kindSelect = screen.getByRole("combobox", {
      name: /^kind$/i,
    }) as HTMLSelectElement;
    fireEvent.change(kindSelect, { target: { value: "edge" } });
    expect(screen.getByText(/Showing 2 of 10/i)).toBeDefined();
  });

  it("opens detail panel with incident message and correlation id", async () => {
    await renderWith(scenarioLoader("service-degraded"));
    const downRow = await screen.findByRole("button", {
      name: /Vehicle service/i,
    });
    fireEvent.click(downRow);
    expect(
      screen.getByRole("complementary", { name: /Service Vehicle service/i }),
    ).toBeDefined();
    expect(
      screen.getByText(/Service is not responding to probes/i),
    ).toBeDefined();
    // Correlation id from the fixture for vehicle-service in service-degraded.
    expect(
      screen.getByText(/00000000-0000-4000-8000-000000000ccc/i),
    ).toBeDefined();
  });

  it("shows a no-incident empty state for a healthy service", async () => {
    await renderWith(scenarioLoader("normal"));
    const healthyRow = await screen.findByRole("button", {
      name: /Candidate service/i,
    });
    fireEvent.click(healthyRow);
    expect(
      screen.getByText(/No recent incidents/i),
    ).toBeDefined();
  });

  it("renders empty state for the empty scenario", async () => {
    await renderWith(scenarioLoader("empty"));
    expect(
      await screen.findByText(/No services reported in this scenario/i),
    ).toBeDefined();
  });

  it("reloads when the Reload button is clicked", async () => {
    let calls = 0;
    const loader = () => {
      calls += 1;
      return serviceHealthFor("normal");
    };
    await renderWith(loader);
    expect(calls).toBe(1);
    fireEvent.click(screen.getByRole("button", { name: /^reload$/i }));
    expect(calls).toBe(2);
  });

  it("surfaces DegradedState when loader throws ApiError 503", async () => {
    const loader = () => {
      throw new ApiError({
        status: 503,
        code: "SERVICE_DEGRADED",
        message: "aggregator is degraded",
        url: "/api/operations/v1/service-health",
      });
    };
    await renderWith(loader);
    expect(screen.getByRole("alert")).toBeDefined();
    expect(
      screen.getByText(/operations · service health/i),
    ).toBeDefined();
  });

  it("surfaces ApiErrorView for non-degraded errors", async () => {
    const loader = () => {
      throw new ApiError({
        status: 400,
        code: "BAD_REQUEST",
        message: "loader failed",
        url: "/api/operations/v1/service-health",
      });
    };
    await renderWith(loader);
    expect(screen.getByText(/BAD_REQUEST/i)).toBeDefined();
  });
});

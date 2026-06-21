import { describe, expect, it } from "vitest";
import { render, screen, within } from "@testing-library/react";

import { consoleDashboardFor } from "@/app/(shell)/dashboard/_components/consoleDashboardFixtures";
import { LocalNodeDashboard } from "@/app/(shell)/dashboard/_components/LocalNodeDashboard";
import type { MockScenario } from "@/api/mock/scenarios";

function renderDashboard(scenario: MockScenario) {
  const loader = () => consoleDashboardFor(scenario);
  render(<LocalNodeDashboard loader={loader} />);
}

describe("LocalNodeDashboard", () => {
  it("renders the Autodrome console dashboard header and all six widgets for the normal scenario", async () => {
    renderDashboard("normal");

    // Service Health header arrives only after the loader effect
    // resolves; awaiting it confirms the snapshot is mounted.
    expect(await screen.findByText("Service health")).toBeDefined();

    expect(
      screen.getByRole("heading", {
        level: 1,
        name: /local node dashboard/i,
      }),
    ).toBeDefined();
    expect(screen.getByText(/NODE-A2/)).toBeDefined();
    expect(screen.getByText(/Autodrome test site/)).toBeDefined();

    expect(screen.getByText("Database readiness")).toBeDefined();
    expect(screen.getByText("Media storage")).toBeDefined();
    expect(screen.getByText("Vehicle telemetry")).toBeDefined();
    expect(screen.getByText("Outbox / event backlog")).toBeDefined();
    expect(screen.getByText("Node operations")).toBeDefined();

    // No degraded notice in the normal scenario.
    expect(
      screen.queryByRole("alert", {
        name: /dashboard degraded notice/i,
      }),
    ).toBeNull();
  });

  it("renders the degraded notice and Paused outbox status for the service-degraded scenario", async () => {
    renderDashboard("service-degraded");
    const alert = await screen.findByRole("alert", {
      name: /dashboard degraded notice/i,
    });
    expect(
      within(alert).getByText(/Vehicle telemetry broker degraded/i),
    ).toBeDefined();
    expect(within(alert).getByText(/Retry sync/i)).toBeDefined();

    expect(screen.getByText(/^Paused$/)).toBeDefined();
  });

  it("renders zeroed telemetry tiles for the empty scenario", async () => {
    renderDashboard("empty");
    const telemetryHeader = await screen.findByText("Vehicle telemetry");
    const telemetryCard = telemetryHeader.closest("section");
    expect(telemetryCard).not.toBeNull();
    const zeros = within(telemetryCard as HTMLElement).getAllByText("0");
    expect(zeros.length).toBeGreaterThanOrEqual(4);
  });

  it("renders fallback skeleton when the loader has not produced a snapshot yet", () => {
    // A loader returning an unresolved Promise keeps the hook in
    // loading state.
    const pending = new Promise<never>(() => {});
    render(
      <LocalNodeDashboard
        loader={() =>
          pending as unknown as ReturnType<typeof consoleDashboardFor>
        }
      />,
    );
    expect(
      screen.getByRole("status", {
        name: /loading local node dashboard/i,
      }),
    ).toBeDefined();
  });
});

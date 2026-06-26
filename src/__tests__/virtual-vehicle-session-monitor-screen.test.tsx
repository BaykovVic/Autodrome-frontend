import { describe, expect, it, vi } from "vitest";
import { render, screen, within } from "@testing-library/react";

vi.mock("next/navigation", () => ({
  usePathname: () => "/virtual-vehicles/sessions/VV-SIM-001",
}));

import { VirtualVehicleSessionMonitorScreen } from "@/app/(shell)/virtual-vehicles/sessions/_components/VirtualVehicleSessionMonitorScreen";
import { consoleVirtualVehicleSessionMonitorFor } from "@/app/(shell)/virtual-vehicles/sessions/_components/consoleVirtualVehicleSessionMonitorFixtures";

describe("VirtualVehicleSessionMonitorScreen", () => {
  it("renders breadcrumb + canonical session id + state badge for running session", async () => {
    render(
      <VirtualVehicleSessionMonitorScreen
        sessionId="VV-SIM-001"
        loader={consoleVirtualVehicleSessionMonitorFor}
      />,
    );
    expect(
      await screen.findByRole("heading", {
        level: 1,
        name: /VV-SIM-001/,
      }),
    ).toBeDefined();
    expect(
      screen.getByRole("link", { name: /virtual vehicles/i }),
    ).toBeDefined();
    // "running" surfaces в state badge.
    expect(screen.getAllByText(/running/i)[0]).toBeDefined();
  });

  it("renders runtime status cards section with canonical chips", async () => {
    render(
      <VirtualVehicleSessionMonitorScreen
        sessionId="VV-SIM-001"
        loader={consoleVirtualVehicleSessionMonitorFor}
      />,
    );
    await screen.findByRole("heading", { name: /VV-SIM-001/ });
    expect(screen.getByText(/Runtime status/i)).toBeDefined();
    // Canonical chips on cards.
    expect(screen.getAllByText("(simulator)").length).toBeGreaterThan(0);
    expect(screen.getAllByText("(telemetryTick)").length).toBeGreaterThan(
      0,
    );
    expect(screen.getAllByText("(wifi)").length).toBeGreaterThan(0);
  });

  it("renders event log section with canonical event-kind chips", async () => {
    render(
      <VirtualVehicleSessionMonitorScreen
        sessionId="VV-SIM-001"
        loader={consoleVirtualVehicleSessionMonitorFor}
      />,
    );
    await screen.findByRole("heading", { name: /VV-SIM-001/ });
    expect(screen.getByText(/Event log/i)).toBeDefined();
    const log = screen.getByRole("list", {
      name: /session event log/i,
    });
    expect(within(log).getByText(/Session started/i)).toBeDefined();
    expect(within(log).getAllByText("(sessionStarted)").length).toBe(1);
    expect(
      within(log).getAllByText("(telemetryTick)").length,
    ).toBeGreaterThan(0);
  });

  it("Start/Pause/Resume/Stop affordances all disabled with operator tooltips", async () => {
    render(
      <VirtualVehicleSessionMonitorScreen
        sessionId="VV-SIM-001"
        loader={consoleVirtualVehicleSessionMonitorFor}
      />,
    );
    await screen.findByRole("heading", { name: /VV-SIM-001/ });
    const group = screen.getByRole("group", {
      name: /session command affordances/i,
    });
    for (const name of [/^start$/i, /^pause$/i, /^resume$/i, /^stop$/i]) {
      const btn = within(group).getByRole("button", {
        name,
      }) as HTMLButtonElement;
      expect(btn.disabled).toBe(true);
      expect(btn.getAttribute("title")?.length ?? 0).toBeGreaterThan(0);
    }
  });

  it("paused session: event log surfaces sessionPaused kind", async () => {
    render(
      <VirtualVehicleSessionMonitorScreen
        sessionId="VV-REPLAY-014"
        loader={consoleVirtualVehicleSessionMonitorFor}
      />,
    );
    await screen.findByRole("heading", { name: /VV-REPLAY-014/ });
    expect(screen.getByText(/(sessionPaused)/)).toBeDefined();
  });

  it("degraded session: warning runtime cards visible + degraded event kind", async () => {
    render(
      <VirtualVehicleSessionMonitorScreen
        sessionId="VV-SIM-DEGRADED"
        loader={consoleVirtualVehicleSessionMonitorFor}
      />,
    );
    await screen.findByRole("heading", { name: /VV-SIM-DEGRADED/ });
    // Cellular telemetry chip surfaces.
    expect(screen.getAllByText("(cellular)").length).toBeGreaterThan(0);
    // Degraded event kind surfaces в log.
    expect(screen.getAllByText("(degraded)").length).toBeGreaterThan(0);
  });

  it("unknown session id renders unknown state without inventing telemetry", async () => {
    render(
      <VirtualVehicleSessionMonitorScreen
        sessionId="VV-NOT-A-SESSION"
        loader={consoleVirtualVehicleSessionMonitorFor}
      />,
    );
    await screen.findByRole("heading", {
      name: /VV-NOT-A-SESSION/,
    });
    // No runtime cards / events.
    expect(
      screen.getByText(/No runtime telemetry available/i),
    ).toBeDefined();
    expect(screen.getByText(/No events recorded yet/i)).toBeDefined();
  });
});

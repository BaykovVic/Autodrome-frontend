import { describe, expect, it, vi } from "vitest";
import { render, screen, within } from "@testing-library/react";

vi.mock("next/navigation", () => ({
  usePathname: () =>
    "/virtual-vehicles/sessions/VV-SIM-001/runtime-preview",
}));

import { VirtualVehicleRuntimePreviewScreen } from "@/app/(shell)/virtual-vehicles/sessions/_components/runtime-preview/VirtualVehicleRuntimePreviewScreen";
import { consoleVirtualVehicleRuntimePreviewFor } from "@/app/(shell)/virtual-vehicles/sessions/_components/runtime-preview/consoleVirtualVehicleRuntimePreviewFixtures";

describe("VirtualVehicleRuntimePreviewScreen", () => {
  it("running session: pose + speed + gear + sensors + simulator badge render", async () => {
    render(
      <VirtualVehicleRuntimePreviewScreen
        sessionId="VV-SIM-001"
        loader={consoleVirtualVehicleRuntimePreviewFor}
      />,
    );
    await screen.findByRole("heading", {
      level: 1,
      name: /runtime preview/i,
    });
    // No reason banner shown for running.
    expect(screen.queryByRole("status")).toBeNull();
    // Pose section renders mono pose + signed yaw.
    expect(screen.getByText(/42\.18 m E, -7\.93 m N/)).toBeDefined();
    expect(screen.getByText(/\+9\.0°/)).toBeDefined();
    expect(screen.getByText(/47 km\/h/)).toBeDefined();
    // Gear canonical chip.
    expect(screen.getByText("(drive)")).toBeDefined();
    // Scenario compatibility badges.
    const badges = screen.getByRole("group", {
      name: /scenario compatibility badges/i,
    });
    expect(within(badges).getByText("(simulator)")).toBeDefined();
    expect(within(badges).getByText("(relative)")).toBeDefined();
    expect(within(badges).getByText("(local)")).toBeDefined();
  });

  it("running session: sensor health list shows canonical capability + health tokens", async () => {
    render(
      <VirtualVehicleRuntimePreviewScreen
        sessionId="VV-SIM-001"
        loader={consoleVirtualVehicleRuntimePreviewFor}
      />,
    );
    await screen.findByRole("heading", {
      level: 1,
      name: /runtime preview/i,
    });
    const list = screen.getByRole("list", { name: /sensor health/i });
    expect(within(list).getByText("(cameraFront)")).toBeDefined();
    expect(within(list).getByText("(lanePerception)")).toBeDefined();
    // OK chips visible.
    expect(within(list).getAllByText("(ok)").length).toBeGreaterThan(0);
  });

  it("paused session: reason banner + fullReplay badge + lanePerception offline", async () => {
    render(
      <VirtualVehicleRuntimePreviewScreen
        sessionId="VV-REPLAY-014"
        loader={consoleVirtualVehicleRuntimePreviewFor}
      />,
    );
    await screen.findByRole("heading", {
      level: 1,
      name: /runtime preview/i,
    });
    const status = screen.getByRole("status");
    expect(status.textContent).toMatch(/session is paused/i);
    const badges = screen.getByRole("group", {
      name: /scenario compatibility badges/i,
    });
    expect(within(badges).getByText("(fullReplay)")).toBeDefined();
    expect(within(badges).getByText("(absolute)")).toBeDefined();
    expect(within(badges).getByText("(world)")).toBeDefined();
    const list = screen.getByRole("list", { name: /sensor health/i });
    // lanePerception row has offline chip.
    expect(within(list).getByText("(offline)")).toBeDefined();
  });

  it("degraded session: warning banner + degraded gnss + offline lidar visible", async () => {
    render(
      <VirtualVehicleRuntimePreviewScreen
        sessionId="VV-SIM-DEGRADED"
        loader={consoleVirtualVehicleRuntimePreviewFor}
      />,
    );
    await screen.findByRole("heading", {
      level: 1,
      name: /runtime preview/i,
    });
    expect(screen.getByRole("status").textContent).toMatch(
      /runtime is degraded/i,
    );
    const list = screen.getByRole("list", { name: /sensor health/i });
    expect(within(list).getAllByText("(degraded)").length).toBeGreaterThan(
      0,
    );
    expect(within(list).getAllByText("(offline)").length).toBeGreaterThan(0);
    // liteReplay + compass yaw + geo frame badges.
    const badges = screen.getByRole("group", {
      name: /scenario compatibility badges/i,
    });
    expect(within(badges).getByText("(liteReplay)")).toBeDefined();
    expect(within(badges).getByText("(compass)")).toBeDefined();
    expect(within(badges).getByText("(geo)")).toBeDefined();
  });

  it("noRuntime session: pose section explicitly says no telemetry, no invented numbers", async () => {
    render(
      <VirtualVehicleRuntimePreviewScreen
        sessionId="VV-REPLAY-OLD"
        loader={consoleVirtualVehicleRuntimePreviewFor}
      />,
    );
    await screen.findByRole("heading", {
      level: 1,
      name: /runtime preview/i,
    });
    const status = screen.getByRole("status");
    expect(status.textContent).toMatch(/no runtime snapshot/i);
    expect(
      screen.getByText(/no pose telemetry has been captured yet/i),
    ).toBeDefined();
    // No "km/h" pose row visible (pose suppressed).
    expect(screen.queryByText(/km\/h/)).toBeNull();
  });

  it("unknown session id: unknown banner + unknown gear", async () => {
    render(
      <VirtualVehicleRuntimePreviewScreen
        sessionId="VV-NOT-A-SESSION"
        loader={consoleVirtualVehicleRuntimePreviewFor}
      />,
    );
    await screen.findByRole("heading", {
      level: 1,
      name: /runtime preview/i,
    });
    expect(screen.getByRole("status").textContent).toMatch(
      /state unknown/i,
    );
  });

  it("breadcrumb exposes back-links to virtual vehicles + session monitor", async () => {
    render(
      <VirtualVehicleRuntimePreviewScreen
        sessionId="VV-SIM-001"
        loader={consoleVirtualVehicleRuntimePreviewFor}
      />,
    );
    await screen.findByRole("heading", {
      level: 1,
      name: /runtime preview/i,
    });
    expect(
      screen.getByRole("link", { name: /virtual vehicles/i }),
    ).toBeDefined();
    expect(
      screen.getByRole("link", { name: /session · VV-SIM-001/i }),
    ).toBeDefined();
  });
});

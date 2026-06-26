import { describe, expect, it, vi } from "vitest";
import { render, screen, within } from "@testing-library/react";

vi.mock("next/navigation", () => ({
  usePathname: () =>
    "/virtual-vehicles/sessions/VV-SIM-001/manual-control",
}));

import { VirtualVehicleManualControlPanelScreen } from "@/app/(shell)/virtual-vehicles/sessions/_components/manual-control/VirtualVehicleManualControlPanelScreen";
import { consoleVirtualVehicleManualControlFor } from "@/app/(shell)/virtual-vehicles/sessions/_components/manual-control/consoleVirtualVehicleManualControlFixtures";

describe("VirtualVehicleManualControlPanelScreen", () => {
  it("renders breadcrumb + heading + drive controls enabled for a running session", async () => {
    render(
      <VirtualVehicleManualControlPanelScreen
        sessionId="VV-SIM-001"
        loader={consoleVirtualVehicleManualControlFor}
      />,
    );
    await screen.findByRole("heading", {
      level: 1,
      name: /manual control/i,
    });
    expect(
      screen.getByRole("link", { name: /virtual vehicles/i }),
    ).toBeDefined();
    expect(
      screen.getByRole("link", { name: /session · VV-SIM-001/i }),
    ).toBeDefined();
    // Speed slider exposes range 0..200.
    const speed = screen.getByRole("slider", {
      name: /target speed in km\/h/i,
    }) as HTMLInputElement;
    expect(speed.disabled).toBe(false);
    expect(speed.min).toBe("0");
    expect(speed.max).toBe("200");
    const steering = screen.getByRole("slider", {
      name: /steering normalized/i,
    }) as HTMLInputElement;
    expect(steering.disabled).toBe(false);
    expect(steering.min).toBe("-1");
    expect(steering.max).toBe("1");
  });

  it("renders sensor toggles with canonical capability tokens visible", async () => {
    render(
      <VirtualVehicleManualControlPanelScreen
        sessionId="VV-SIM-001"
        loader={consoleVirtualVehicleManualControlFor}
      />,
    );
    await screen.findByRole("heading", {
      level: 1,
      name: /manual control/i,
    });
    const list = screen.getByRole("list", { name: /sensor toggles/i });
    expect(within(list).getByText(/Front camera/i)).toBeDefined();
    expect(within(list).getByText(/\(cameraFront\)/)).toBeDefined();
    expect(within(list).getByText(/\(lidar\)/)).toBeDefined();
    expect(within(list).getByText(/\(imu\)/)).toBeDefined();
    expect(within(list).getByText(/\(gnss\)/)).toBeDefined();
    expect(within(list).getByText(/\(wheelOdometry\)/)).toBeDefined();
    expect(within(list).getByText(/\(lanePerception\)/)).toBeDefined();
    expect(
      screen.getByText(/no raw bitmask UI is exposed/i),
    ).toBeDefined();
  });

  it("paused session: controls disabled + disabled banner explains why", async () => {
    render(
      <VirtualVehicleManualControlPanelScreen
        sessionId="VV-REPLAY-014"
        loader={consoleVirtualVehicleManualControlFor}
      />,
    );
    await screen.findByRole("heading", {
      level: 1,
      name: /manual control/i,
    });
    const speed = screen.getByRole("slider", {
      name: /target speed in km\/h/i,
    }) as HTMLInputElement;
    expect(speed.disabled).toBe(true);
    const status = screen.getByRole("status");
    expect(status.textContent).toMatch(/session is paused/i);
  });

  it("degraded session: lidar + gnss sensors rendered as off", async () => {
    render(
      <VirtualVehicleManualControlPanelScreen
        sessionId="VV-SIM-DEGRADED"
        loader={consoleVirtualVehicleManualControlFor}
      />,
    );
    await screen.findByRole("heading", {
      level: 1,
      name: /manual control/i,
    });
    const lidar = screen.getByRole("checkbox", {
      name: /Lidar \(lidar\)/i,
    }) as HTMLInputElement;
    const gnss = screen.getByRole("checkbox", {
      name: /GNSS \(gnss\)/i,
    }) as HTMLInputElement;
    expect(lidar.checked).toBe(false);
    expect(gnss.checked).toBe(false);
    expect(lidar.disabled).toBe(true);
    expect(gnss.disabled).toBe(true);
    const status = screen.getByRole("status");
    expect(status.textContent).toMatch(/degraded/i);
  });

  it("stopped session: controls disabled + reset/send command buttons disabled", async () => {
    render(
      <VirtualVehicleManualControlPanelScreen
        sessionId="VV-REPLAY-OLD"
        loader={consoleVirtualVehicleManualControlFor}
      />,
    );
    await screen.findByRole("heading", {
      level: 1,
      name: /manual control/i,
    });
    const reset = screen.getByRole("button", {
      name: /reset position/i,
    }) as HTMLButtonElement;
    const send = screen.getByRole("button", {
      name: /send command/i,
    }) as HTMLButtonElement;
    expect(reset.disabled).toBe(true);
    expect(send.disabled).toBe(true);
    const banner = screen.getByRole("status");
    expect(banner.textContent).toMatch(/stopped/i);
  });

  it("unknown session id: unknown state with controls disabled, no telemetry invented", async () => {
    render(
      <VirtualVehicleManualControlPanelScreen
        sessionId="VV-NOT-A-SESSION"
        loader={consoleVirtualVehicleManualControlFor}
      />,
    );
    await screen.findByRole("heading", {
      level: 1,
      name: /manual control/i,
    });
    const banner = screen.getByRole("status");
    expect(banner.textContent).toMatch(/unknown/i);
    const speed = screen.getByRole("slider", {
      name: /target speed in km\/h/i,
    }) as HTMLInputElement;
    expect(speed.disabled).toBe(true);
    expect(speed.defaultValue).toBe("0");
  });

  it("speed slider defaultValue matches the running fixture value", async () => {
    render(
      <VirtualVehicleManualControlPanelScreen
        sessionId="VV-SIM-001"
        loader={consoleVirtualVehicleManualControlFor}
      />,
    );
    await screen.findByRole("heading", {
      level: 1,
      name: /manual control/i,
    });
    const speed = screen.getByRole("slider", {
      name: /target speed in km\/h/i,
    }) as HTMLInputElement;
    // Fixture value rendered on label (mono span).
    expect(screen.getByText(/47 km\/h/)).toBeDefined();
    expect(speed.defaultValue).toBe("47");
  });

  it("renders 'last command at' timestamp from fixture", async () => {
    render(
      <VirtualVehicleManualControlPanelScreen
        sessionId="VV-SIM-001"
        loader={consoleVirtualVehicleManualControlFor}
      />,
    );
    await screen.findByRole("heading", {
      level: 1,
      name: /manual control/i,
    });
    expect(
      screen.getByText(/Last command at: 2026-06-26T09:33:51Z/),
    ).toBeDefined();
  });
});

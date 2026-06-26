import { describe, expect, it, vi } from "vitest";
import { fireEvent, render, screen, within } from "@testing-library/react";

vi.mock("next/navigation", () => ({
  usePathname: () => "/virtual-vehicles",
}));

import { VirtualVehiclesScreen } from "@/app/(shell)/virtual-vehicles/_components/VirtualVehiclesScreen";
import { consoleVirtualVehiclesFor } from "@/app/(shell)/virtual-vehicles/_components/consoleVirtualVehiclesFixtures";

describe("VirtualVehiclesScreen", () => {
  it("renders heading + status tabs + canonical rows", async () => {
    render(
      <VirtualVehiclesScreen
        loader={() => consoleVirtualVehiclesFor("normal")}
      />,
    );
    expect(
      await screen.findByRole("heading", {
        level: 1,
        name: /virtual vehicles/i,
      }),
    ).toBeDefined();
    expect(screen.getByRole("tab", { name: /^all$/i })).toBeDefined();
    expect(screen.getByRole("tab", { name: /^running$/i })).toBeDefined();
    expect(screen.getByRole("tab", { name: /^idle$/i })).toBeDefined();
    expect(screen.getByRole("tab", { name: /^degraded$/i })).toBeDefined();
  });

  it("renders one row per vehicle and shows canonical source tokens", async () => {
    render(
      <VirtualVehiclesScreen
        loader={() => consoleVirtualVehiclesFor("normal")}
      />,
    );
    expect(
      await screen.findByRole("button", { name: /VV-SIM-001/ }),
    ).toBeDefined();
    expect(
      screen.getByRole("button", { name: /VV-REPLAY-014/ }),
    ).toBeDefined();
    expect(
      screen.getByRole("button", { name: /VV-MANUAL-LIVE-3/ }),
    ).toBeDefined();
    // Canonical source tokens visible alongside operator labels.
    expect(screen.getAllByText("(simulator)").length).toBeGreaterThan(0);
    expect(
      screen.getAllByText("(legacyReplay)").length,
    ).toBeGreaterThan(0);
    expect(
      screen.getAllByText("(operatorManual)").length,
    ).toBeGreaterThan(0);
  });

  it("default selection points at the first vehicle (detail aside renders)", async () => {
    render(
      <VirtualVehiclesScreen
        loader={() => consoleVirtualVehiclesFor("normal")}
      />,
    );
    await screen.findByRole("button", { name: /VV-SIM-001/ });
    expect(
      screen.getByRole("complementary", {
        name: /Virtual vehicle VV-SIM-001/i,
      }),
    ).toBeDefined();
  });

  it("Running filter narrows to running sessions only", async () => {
    render(
      <VirtualVehiclesScreen
        loader={() => consoleVirtualVehiclesFor("normal")}
      />,
    );
    await screen.findByRole("button", { name: /VV-SIM-001/ });
    fireEvent.click(screen.getByRole("tab", { name: /^running$/i }));
    expect(
      screen.queryByRole("button", { name: /VV-SIM-002/ }),
    ).toBeNull();
    expect(
      screen.getByRole("button", { name: /VV-SIM-001/ }),
    ).toBeDefined();
  });

  it("clicking a row switches the detail aside", async () => {
    render(
      <VirtualVehiclesScreen
        loader={() => consoleVirtualVehiclesFor("normal")}
      />,
    );
    await screen.findByRole("button", { name: /VV-SIM-001/ });
    fireEvent.click(
      screen.getByRole("button", { name: /VV-REPLAY-014/ }),
    );
    expect(
      screen.getByRole("complementary", {
        name: /Virtual vehicle VV-REPLAY-014/i,
      }),
    ).toBeDefined();
  });

  it("detail aside surfaces Identity + Scenario + Telemetry sections with canonical source chip", async () => {
    render(
      <VirtualVehiclesScreen
        loader={() => consoleVirtualVehiclesFor("normal")}
      />,
    );
    await screen.findByRole("button", { name: /VV-SIM-001/ });
    const detail = screen.getByRole("complementary", {
      name: /Virtual vehicle VV-SIM-001/i,
    });
    expect(within(detail).getByText(/^Identity$/i)).toBeDefined();
    expect(within(detail).getByText(/^Scenario$/i)).toBeDefined();
    expect(within(detail).getByText(/^Telemetry$/i)).toBeDefined();
    // Canonical source token visible in detail aside.
    expect(within(detail).getByText("(simulator)")).toBeDefined();
    // Scenario id surfaces.
    expect(within(detail).getByText("SC-CITY-A")).toBeDefined();
  });

  it("Stop / Pause affordances are disabled with tooltip explaining upcoming live API integration", async () => {
    render(
      <VirtualVehiclesScreen
        loader={() => consoleVirtualVehiclesFor("normal")}
      />,
    );
    await screen.findByRole("button", { name: /VV-SIM-001/ });
    const detail = screen.getByRole("complementary", {
      name: /Virtual vehicle VV-SIM-001/i,
    });
    const stop = within(detail).getByRole("button", {
      name: /^stop$/i,
    }) as HTMLButtonElement;
    const pause = within(detail).getByRole("button", {
      name: /^pause$/i,
    }) as HTMLButtonElement;
    expect(stop.disabled).toBe(true);
    expect(pause.disabled).toBe(true);
    expect(stop.getAttribute("title")).toMatch(
      /live API integration/i,
    );
  });

  it("empty scenario renders an EmptyState", async () => {
    render(
      <VirtualVehiclesScreen
        loader={() => consoleVirtualVehiclesFor("empty")}
      />,
    );
    expect(
      await screen.findByText(/No virtual vehicles/i),
    ).toBeDefined();
  });
});

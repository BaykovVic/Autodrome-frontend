import { describe, expect, it, vi } from "vitest";
import { fireEvent, render, screen, within } from "@testing-library/react";

vi.mock("next/navigation", () => ({
  usePathname: () => "/virtual-vehicles/scenarios",
}));

import { VirtualVehicleScenarioCatalogScreen } from "@/app/(shell)/virtual-vehicles/scenarios/_components/VirtualVehicleScenarioCatalogScreen";
import { consoleVirtualVehicleScenariosFor } from "@/app/(shell)/virtual-vehicles/scenarios/_components/consoleVirtualVehicleScenariosFixtures";

describe("VirtualVehicleScenarioCatalogScreen", () => {
  it("renders heading + breadcrumb + status tabs", async () => {
    render(
      <VirtualVehicleScenarioCatalogScreen
        loader={() => consoleVirtualVehicleScenariosFor("normal")}
      />,
    );
    expect(
      await screen.findByRole("heading", {
        level: 1,
        name: /^scenario catalog$/i,
      }),
    ).toBeDefined();
    // Breadcrumb back-link к workspace.
    expect(
      screen.getByRole("link", { name: /virtual vehicles/i }),
    ).toBeDefined();
    expect(screen.getByRole("tab", { name: /^all$/i })).toBeDefined();
    expect(screen.getByRole("tab", { name: /^published$/i })).toBeDefined();
    expect(screen.getByRole("tab", { name: /^draft$/i })).toBeDefined();
    expect(screen.getByRole("tab", { name: /^archived$/i })).toBeDefined();
  });

  it("renders rows and surfaces canonical source tokens (Lite + Full visible)", async () => {
    render(
      <VirtualVehicleScenarioCatalogScreen
        loader={() => consoleVirtualVehicleScenariosFor("normal")}
      />,
    );
    expect(
      await screen.findByRole("button", { name: /SC-CITY-A/ }),
    ).toBeDefined();
    expect(
      screen.getByRole("button", { name: /SC-LITE-014/ }),
    ).toBeDefined();
    expect(
      screen.getByRole("button", { name: /SC-FULL-042/ }),
    ).toBeDefined();
    // Canonical source tokens distinguished:
    expect(
      screen.getAllByText("(liteReplay)").length,
    ).toBeGreaterThan(0);
    expect(
      screen.getAllByText("(fullReplay)").length,
    ).toBeGreaterThan(0);
    expect(screen.getAllByText("(simulator)").length).toBeGreaterThan(0);
  });

  it("Draft tab narrows visible rows to draft scenarios", async () => {
    render(
      <VirtualVehicleScenarioCatalogScreen
        loader={() => consoleVirtualVehicleScenariosFor("normal")}
      />,
    );
    await screen.findByRole("button", { name: /SC-CITY-A/ });
    fireEvent.click(screen.getByRole("tab", { name: /^draft$/i }));
    expect(
      screen.queryByRole("button", { name: /SC-CITY-A/ }),
    ).toBeNull();
    expect(
      screen.getByRole("button", { name: /SC-DRAFT-NEW/ }),
    ).toBeDefined();
  });

  it("clicking a row switches the detail aside (Lite source canonical chip visible)", async () => {
    render(
      <VirtualVehicleScenarioCatalogScreen
        loader={() => consoleVirtualVehicleScenariosFor("normal")}
      />,
    );
    await screen.findByRole("button", { name: /SC-CITY-A/ });
    fireEvent.click(screen.getByRole("button", { name: /SC-LITE-014/ }));
    const detail = screen.getByRole("complementary", {
      name: /Scenario SC-LITE-014/i,
    });
    expect(within(detail).getByText(/^Description$/i)).toBeDefined();
    expect(
      within(detail).getAllByText(/^Source$/i).length,
    ).toBeGreaterThanOrEqual(1);
    expect(
      within(detail).getByText(/Coordinate \/ yaw frames/i),
    ).toBeDefined();
    // Canonical lite token in detail aside.
    expect(within(detail).getAllByText("(liteReplay)").length).toBeGreaterThan(0);
  });

  it("detail aside renders compatibility fields (yaw + coordinate frame) for Full scenario", async () => {
    render(
      <VirtualVehicleScenarioCatalogScreen
        loader={() => consoleVirtualVehicleScenariosFor("normal")}
      />,
    );
    await screen.findByRole("button", { name: /SC-CITY-A/ });
    fireEvent.click(screen.getByRole("button", { name: /SC-FULL-042/ }));
    const detail = screen.getByRole("complementary", {
      name: /Scenario SC-FULL-042/i,
    });
    // Yaw frame absolute + coordinate frame geo (per fixture).
    expect(within(detail).getAllByText("(absolute)").length).toBeGreaterThan(0);
    expect(within(detail).getAllByText("(geo)").length).toBeGreaterThan(0);
  });

  it("New scenario / Edit / Duplicate affordances disabled with tooltips referencing upcoming live API integration", async () => {
    render(
      <VirtualVehicleScenarioCatalogScreen
        loader={() => consoleVirtualVehicleScenariosFor("normal")}
      />,
    );
    await screen.findByRole("button", { name: /SC-CITY-A/ });
    const newCta = screen.getByRole("button", {
      name: /new scenario/i,
    }) as HTMLButtonElement;
    expect(newCta.disabled).toBe(true);
    expect(newCta.getAttribute("title")).toMatch(/live API integration/i);
    const editCta = screen.getAllByRole("button", {
      name: /^edit$/i,
    })[0] as HTMLButtonElement;
    expect(editCta.disabled).toBe(true);
  });

  it("renders the 'no raw protocol editor' operator-visible note", async () => {
    render(
      <VirtualVehicleScenarioCatalogScreen
        loader={() => consoleVirtualVehicleScenariosFor("normal")}
      />,
    );
    expect(
      await screen.findByText(/raw protocol editor is intentionally not exposed/i),
    ).toBeDefined();
  });

  it("empty scenario renders an EmptyState", async () => {
    render(
      <VirtualVehicleScenarioCatalogScreen
        loader={() => consoleVirtualVehicleScenariosFor("empty")}
      />,
    );
    expect(
      (await screen.findAllByText(/No scenarios/i)).length,
    ).toBeGreaterThanOrEqual(1);
  });
});

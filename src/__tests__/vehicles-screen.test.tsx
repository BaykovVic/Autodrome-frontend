import { describe, expect, it } from "vitest";
import { fireEvent, render, screen, within } from "@testing-library/react";

import { VehiclesScreen } from "@/app/(shell)/vehicles/_components/VehiclesScreen";
import { consoleVehiclesFor } from "@/app/(shell)/vehicles/_components/consoleRegistryFixtures";
import type { MockScenario } from "@/api/mock/scenarios";

function renderScreen(scenario: MockScenario) {
  render(
    <VehiclesScreen loader={() => consoleVehiclesFor(scenario)} />,
  );
}

describe("VehiclesScreen", () => {
  it("renders header with totals from the normal scenario", async () => {
    renderScreen("normal");
    expect(
      await screen.findByRole("heading", {
        level: 1,
        name: /vehicles/i,
      }),
    ).toBeDefined();
    expect(
      await screen.findByText(/6 vehicles · 1 degraded, 1 offline/),
    ).toBeDefined();
  });

  it("disables the Re-poll devices action (out-of-scope for design feature)", async () => {
    renderScreen("normal");
    const btn = (await screen.findByRole("button", {
      name: /re-poll devices/i,
    })) as HTMLButtonElement;
    expect(btn.disabled).toBe(true);
  });

  it("filters by device state (offline)", async () => {
    renderScreen("normal");
    // VEH-01 is the first row + default detail (so appears twice).
    expect(
      (await screen.findAllByText("VEH-01")).length,
    ).toBeGreaterThan(0);
    const select = screen.getByRole("combobox", {
      name: /device state/i,
    }) as HTMLSelectElement;
    fireEvent.change(select, { target: { value: "offline" } });
    expect(screen.getAllByText("UAZ Patriot 2024").length).toBeGreaterThan(
      0,
    );
    expect(screen.queryByText("VEH-01")).toBeNull();
  });

  it("filters by search substring (plate/id/model)", async () => {
    renderScreen("normal");
    await screen.findAllByText("VEH-01");
    const search = screen.getByRole("textbox", { name: /search/i });
    fireEvent.change(search, { target: { value: "VEH-30" } });
    expect(screen.getAllByText("Т 909 ОУ 199").length).toBeGreaterThan(0);
    expect(screen.queryByText("VEH-07")).toBeNull();
  });

  it("renders empty state for the empty scenario", async () => {
    renderScreen("empty");
    expect(
      await screen.findByText(/No vehicles in this scenario/i),
    ).toBeDefined();
  });

  it("opens equipment health + device block in detail when a row is selected", async () => {
    renderScreen("normal");
    await screen.findAllByText("VEH-01");
    fireEvent.click(screen.getByText("VEH-07"));
    const detail = screen.getByRole("complementary", {
      name: /Vehicle VEH-07/i,
    });
    expect(
      within(detail).getByText(/Equipment health/i),
    ).toBeDefined();
    expect(within(detail).getByText(/Telemetry uplink/i)).toBeDefined();
    expect(within(detail).getByText(/Firmware/i)).toBeDefined();
    // Action buttons disabled per scope.
    const diagBtn = within(detail).getByRole("button", {
      name: /diagnostics/i,
    }) as HTMLButtonElement;
    expect(diagBtn.disabled).toBe(true);
  });
});

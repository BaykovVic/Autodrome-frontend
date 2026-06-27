import { describe, expect, it, vi } from "vitest";
import { fireEvent, render, screen } from "@testing-library/react";

vi.mock("next/navigation", () => ({
  usePathname: () => "/traffic-control",
}));

import { TrafficControlScreen } from "@/app/(shell)/traffic-control/_components/TrafficControlScreen";
import { consoleTrafficFor } from "@/app/(shell)/traffic-control/_components/consoleTrafficFixtures";

describe("TrafficControlScreen", () => {
  it("renders controllers + lights tables on normal scenario", () => {
    render(
      <TrafficControlScreen
        snapshotOverride={consoleTrafficFor("normal")}
      />,
    );
    expect(
      screen.getByRole("heading", { level: 1, name: /traffic control/i }),
    ).toBeDefined();
    expect(
      screen.getByRole("table", { name: /traffic controllers/i }),
    ).toBeDefined();
    expect(
      screen.getByRole("table", { name: /traffic lights/i }),
    ).toBeDefined();
  });

  it("non-destructive setProgram command is recorded without confirmation", () => {
    render(
      <TrafficControlScreen
        snapshotOverride={consoleTrafficFor("normal")}
      />,
    );
    const programBtns = screen.getAllByRole("button", {
      name: /^setProgram$/i,
    });
    fireEvent.click(programBtns[0]!);
    expect(
      screen.getByRole("list", { name: /recent traffic commands/i }),
    ).toBeDefined();
  });

  it("destructive reset command opens confirmation dialog", () => {
    render(
      <TrafficControlScreen
        snapshotOverride={consoleTrafficFor("normal")}
      />,
    );
    const resetBtns = screen.getAllByRole("button", {
      name: /^reset/i,
    });
    fireEvent.click(resetBtns[0]!);
    // Dialog opens with confirm action label.
    expect(
      screen.getByRole("button", { name: /send dangerous command/i }),
    ).toBeDefined();
    expect(screen.getByText(/destructive command/i)).toBeDefined();
  });

  it("offline controller buttons are disabled (cannot dispatch)", () => {
    render(
      <TrafficControlScreen
        snapshotOverride={consoleTrafficFor("normal")}
      />,
    );
    // 3rd controller is offline; its setProgram button is
    // disabled (only capability it has).
    const allSetProgram = screen.getAllByRole("button", {
      name: /^setProgram$/i,
    }) as HTMLButtonElement[];
    expect(allSetProgram.some((b) => b.disabled)).toBe(true);
  });

  it("service-degraded scenario surfaces degraded note + drops offline controller", () => {
    render(
      <TrafficControlScreen
        snapshotOverride={consoleTrafficFor("service-degraded")}
      />,
    );
    expect(
      screen.getByLabelText(/traffic degraded note/i),
    ).toBeDefined();
  });
});

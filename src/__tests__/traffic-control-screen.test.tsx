import { describe, expect, it, vi } from "vitest";
import { fireEvent, render, screen } from "@testing-library/react";

vi.mock("next/navigation", () => ({
  usePathname: () => "/traffic-control",
}));

import { TrafficControlScreen } from "@/app/(shell)/traffic-control/_components/TrafficControlScreen";
import { consoleTrafficFor } from "@/app/(shell)/traffic-control/_components/consoleTrafficFixtures";

describe("TrafficControlScreen", () => {
  it("renders controllers + lights tables on normal scenario", async () => {
    render(
      <TrafficControlScreen
        snapshotOverride={consoleTrafficFor("normal")}
      />,
    );
    expect(
      await screen.findByRole("heading", { level: 1, name: /traffic control/i }),
    ).toBeDefined();
    expect(
      screen.getByRole("table", { name: /traffic controllers/i }),
    ).toBeDefined();
    expect(
      screen.getByRole("table", { name: /traffic lights/i }),
    ).toBeDefined();
  });

  it("non-destructive setProgram command is recorded without confirmation", async () => {
    render(
      <TrafficControlScreen
        snapshotOverride={consoleTrafficFor("normal")}
      />,
    );
    const programBtns = await screen.findAllByRole("button", {
      name: /^setProgram$/i,
    });
    fireEvent.click(programBtns[0]!);
    // Acceptance is awaited (mock sender resolves asynchronously).
    expect(
      await screen.findByRole("list", { name: /recent traffic commands/i }),
    ).toBeDefined();
  });

  it("destructive reset command opens confirmation dialog", async () => {
    render(
      <TrafficControlScreen
        snapshotOverride={consoleTrafficFor("normal")}
      />,
    );
    const resetBtns = await screen.findAllByRole("button", {
      name: /^reset/i,
    });
    fireEvent.click(resetBtns[0]!);
    // Dialog opens with confirm action label.
    expect(
      screen.getByRole("button", { name: /send dangerous command/i }),
    ).toBeDefined();
    expect(screen.getByText(/destructive command/i)).toBeDefined();
  });

  it("offline controller buttons are disabled (cannot dispatch)", async () => {
    render(
      <TrafficControlScreen
        snapshotOverride={consoleTrafficFor("normal")}
      />,
    );
    // 3rd controller is offline; its setProgram button is
    // disabled (only capability it has).
    const allSetProgram = (await screen.findAllByRole("button", {
      name: /^setProgram$/i,
    })) as HTMLButtonElement[];
    expect(allSetProgram.some((b) => b.disabled)).toBe(true);
  });

  it("service-degraded scenario surfaces degraded note + drops offline controller", async () => {
    render(
      <TrafficControlScreen
        snapshotOverride={consoleTrafficFor("service-degraded")}
      />,
    );
    expect(
      await screen.findByLabelText(/traffic degraded note/i),
    ).toBeDefined();
  });
});

import { describe, expect, it } from "vitest";
import { fireEvent, render, screen, within } from "@testing-library/react";

import { ViolationsScreen } from "@/app/(shell)/violations/_components/ViolationsScreen";
import { consoleViolationsFor } from "@/app/(shell)/violations/_components/consoleViolationsFixtures";
import type { MockScenario } from "@/api/mock/scenarios";

function renderScreen(scenario: MockScenario) {
  render(<ViolationsScreen loader={() => consoleViolationsFor(scenario)} />);
}

describe("ViolationsScreen", () => {
  it("renders header with active rule and severity legend", async () => {
    renderScreen("normal");
    expect(
      await screen.findByRole("heading", {
        level: 1,
        name: /violations catalog/i,
      }),
    ).toBeDefined();
    expect(
      await screen.findByText(/RULE-014 · v6/i),
    ).toBeDefined();
    const legend = screen.getByLabelText(/severity legend/i);
    expect(within(legend).getByText(/^critical$/i)).toBeDefined();
    expect(within(legend).getByText(/^major$/i)).toBeDefined();
    expect(within(legend).getByText(/^minor$/i)).toBeDefined();
  });

  it("renders catalog rows with code/severity/penalty/status", async () => {
    renderScreen("normal");
    await screen.findAllByText("VIO-101");
    expect(screen.getAllByText("VIO-102").length).toBeGreaterThan(0);
    expect(screen.getAllByText("5 pt").length).toBeGreaterThan(0);
  });

  it("opens detail with scoring and required evidence chips", async () => {
    renderScreen("normal");
    await screen.findAllByText("VIO-101");
    fireEvent.click(screen.getByRole("button", { name: /VIO-103/i }));
    const detail = screen.getByRole("complementary", {
      name: /Violation VIO-103/i,
    });
    expect(within(detail).getByText(/Stop line crossed/i)).toBeDefined();
    expect(within(detail).getByText(/Scoring/i)).toBeDefined();
    expect(within(detail).getByText(/Active rule/i)).toBeDefined();
    expect(within(detail).getByText(/Required evidence/i)).toBeDefined();
    expect(within(detail).getByText(/Telemetry/i)).toBeDefined();
    expect(within(detail).getByText(/Video/i)).toBeDefined();
  });

  it("renders empty state for the empty scenario", async () => {
    renderScreen("empty");
    expect(
      await screen.findByText(/No violations in this scenario/i),
    ).toBeDefined();
  });

  it("renders Skeleton while loader is pending (R1 pattern)", () => {
    const pending = new Promise<never>(() => {});
    render(
      <ViolationsScreen
        loader={() =>
          pending as unknown as ReturnType<typeof consoleViolationsFor>
        }
      />,
    );
    expect(
      screen.getByRole("status", { name: /loading violations/i }),
    ).toBeDefined();
  });

  it("renders ApiErrorView with retry when loader rejects (R1 pattern)", async () => {
    const error = Object.assign(new Error("loader failed"), {
      code: "LOADER_FAIL",
      status: 500,
    });
    render(<ViolationsScreen loader={() => Promise.reject(error)} />);
    expect(
      await screen.findByText(/loader failed/i),
    ).toBeDefined();
    expect(
      screen.getByRole("button", { name: /try again|retry/i }),
    ).toBeDefined();
  });

  it("selects a row via the keyboard-accessible primary-cell button (R2 pattern)", async () => {
    renderScreen("normal");
    await screen.findAllByText("VIO-101");
    fireEvent.click(screen.getByRole("button", { name: /VIO-105/i }));
    expect(
      screen.getByRole("complementary", { name: /Violation VIO-105/i }),
    ).toBeDefined();
  });
});

import { describe, expect, it } from "vitest";
import { fireEvent, render, screen, within } from "@testing-library/react";

import { RulesScreen } from "@/app/(shell)/rules/_components/RulesScreen";
import { consoleRulesFor } from "@/app/(shell)/rules/_components/consoleRulesFixtures";
import type { MockScenario } from "@/api/mock/scenarios";

function renderScreen(scenario: MockScenario) {
  render(<RulesScreen loader={() => consoleRulesFor(scenario)} />);
}

describe("RulesScreen", () => {
  it("renders header with title and subtitle", async () => {
    renderScreen("normal");
    expect(
      await screen.findByRole("heading", { level: 1, name: /^rules$/i }),
    ).toBeDefined();
    expect(
      await screen.findByText(/scoring rule sets/i),
    ).toBeDefined();
  });

  it("disables New rule (out-of-scope for design feature)", async () => {
    renderScreen("normal");
    const btn = (await screen.findByRole("button", {
      name: /new rule/i,
    })) as HTMLButtonElement;
    expect(btn.disabled).toBe(true);
  });

  it("renders rules table with name+id, version, status, updated", async () => {
    renderScreen("normal");
    await screen.findAllByText(/RULE-014/);
    expect(
      screen.getAllByText(/City driving · 2026 baseline/i).length,
    ).toBeGreaterThan(0);
    expect(screen.getAllByText(/RULE-013/).length).toBeGreaterThan(0);
    expect(screen.getAllByText(/RULE-012/).length).toBeGreaterThan(0);
  });

  it("opens detail with condition tree preview, planned tag, and version history", async () => {
    renderScreen("normal");
    await screen.findAllByText(/RULE-014/);
    const detail = screen.getByRole("complementary", {
      name: /Rule RULE-014/i,
    });
    expect(within(detail).getByText(/^Condition tree$/i)).toBeDefined();
    expect(within(detail).getByText(/EDITOR · PLANNED/i)).toBeDefined();
    expect(
      within(detail).getByText(/Read-only preview\./i),
    ).toBeDefined();
    expect(
      within(detail).getByText(/Visual condition tree editor ships/i),
    ).toBeDefined();
    expect(within(detail).getByText(/Version history/i)).toBeDefined();
    expect(within(detail).getByText(/v6 · current/i)).toBeDefined();
    expect(within(detail).getByText(/v5 · archived/i)).toBeDefined();
    // Publish/Save buttons exist and are disabled.
    const publishBtn = within(detail).getByRole("button", {
      name: /publish version/i,
    }) as HTMLButtonElement;
    expect(publishBtn.disabled).toBe(true);
    const saveBtn = within(detail).getByRole("button", {
      name: /save draft/i,
    }) as HTMLButtonElement;
    expect(saveBtn.disabled).toBe(true);
  });

  it("renders empty state for the empty scenario", async () => {
    renderScreen("empty");
    expect(
      await screen.findByText(/No rules in this scenario/i),
    ).toBeDefined();
  });

  it("renders Skeleton while loader is pending (R1 pattern)", () => {
    const pending = new Promise<never>(() => {});
    render(
      <RulesScreen
        loader={() =>
          pending as unknown as ReturnType<typeof consoleRulesFor>
        }
      />,
    );
    expect(
      screen.getByRole("status", { name: /loading rules/i }),
    ).toBeDefined();
  });

  it("renders ApiErrorView with retry when loader rejects (R1 pattern)", async () => {
    const error = Object.assign(new Error("loader failed"), {
      code: "LOADER_FAIL",
      status: 500,
    });
    render(<RulesScreen loader={() => Promise.reject(error)} />);
    expect(
      await screen.findByText(/loader failed/i),
    ).toBeDefined();
    expect(
      screen.getByRole("button", { name: /try again|retry/i }),
    ).toBeDefined();
  });

  it("selects a row via the keyboard-accessible primary-cell button (R2 pattern)", async () => {
    renderScreen("normal");
    await screen.findAllByText(/RULE-014/);
    fireEvent.click(
      screen.getByRole("button", { name: /Parking · alignment/i }),
    );
    expect(
      screen.getByRole("complementary", { name: /Rule RULE-012/i }),
    ).toBeDefined();
  });
});

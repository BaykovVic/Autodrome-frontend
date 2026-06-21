import { describe, expect, it } from "vitest";
import { fireEvent, render, screen, within } from "@testing-library/react";

import { CandidatesScreen } from "@/app/(shell)/candidates/_components/CandidatesScreen";
import { consoleCandidatesFor } from "@/app/(shell)/candidates/_components/consoleRegistryFixtures";
import type { MockScenario } from "@/api/mock/scenarios";

function renderScreen(scenario: MockScenario) {
  render(
    <CandidatesScreen loader={() => consoleCandidatesFor(scenario)} />,
  );
}

describe("CandidatesScreen", () => {
  it("renders header, totals subtitle and a row per candidate from the normal scenario", async () => {
    renderScreen("normal");
    expect(
      await screen.findByRole("heading", {
        level: 1,
        name: /candidates/i,
      }),
    ).toBeDefined();
    // Totals: 7 records · 4 awaiting face verification (3 pending +
    // 1 unverified registered + 1 unverified incomplete + 1 unverified
    // pending). Fixture has 7 candidates; awaiting count derives.
    expect(
      await screen.findByText(/7 records/),
    ).toBeDefined();
  });

  it("disables the Register candidate action (out-of-scope for design feature)", async () => {
    renderScreen("normal");
    const btn = (await screen.findByRole("button", {
      name: /register candidate/i,
    })) as HTMLButtonElement;
    expect(btn.disabled).toBe(true);
  });

  it("filters by registration state via the dropdown", async () => {
    renderScreen("normal");
    // CND-1042 is the first row + default detail (so appears twice).
    expect(
      (await screen.findAllByText("CND-1042")).length,
    ).toBeGreaterThan(0);
    const select = screen.getByRole("combobox", {
      name: /registration/i,
    }) as HTMLSelectElement;
    fireEvent.change(select, { target: { value: "incomplete" } });
    expect(screen.queryByText("CND-1042")).toBeNull();
    expect(screen.getAllByText("CND-1047").length).toBeGreaterThan(0);
  });

  it("filters by search substring (case-insensitive)", async () => {
    renderScreen("normal");
    await screen.findAllByText("CND-1042");
    const search = screen.getByRole("textbox", { name: /search/i });
    fireEvent.change(search, { target: { value: "lazar" } });
    expect(screen.getAllByText("CND-1046").length).toBeGreaterThan(0);
    expect(screen.queryByText("CND-1042")).toBeNull();
  });

  it("renders empty state for the empty scenario", async () => {
    renderScreen("empty");
    expect(
      await screen.findByText(/No candidates in this scenario/i),
    ).toBeDefined();
  });

  it("opens face-verification block in detail when a row is selected", async () => {
    renderScreen("normal");
    await screen.findAllByText("CND-1042");
    fireEvent.click(screen.getByText("K. Lazareva"));
    const detail = screen.getByRole("complementary", {
      name: /Candidate CND-1046/i,
    });
    expect(
      within(detail).getByText(/Face verification/i),
    ).toBeDefined();
    expect(within(detail).getByText("0.99")).toBeDefined();
    expect(within(detail).getByText("+7 999 211 64 09")).toBeDefined();
    // All action buttons disabled per scope.
    const startBtn = within(detail).getByRole("button", {
      name: /start exam/i,
    }) as HTMLButtonElement;
    expect(startBtn.disabled).toBe(true);
  });
});

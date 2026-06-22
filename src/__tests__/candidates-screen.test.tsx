import { describe, expect, it } from "vitest";
import { fireEvent, render, screen, within } from "@testing-library/react";

import { CandidatesScreen } from "@/app/(shell)/candidates/_components/CandidatesScreen";
import { consoleCandidatesFor } from "@/app/(shell)/candidates/_components/consoleRegistryFixtures";
import type {
  CandidateEnrollmentState,
  ConsoleCandidate,
} from "@/app/(shell)/candidates/_components/consoleRegistrySnapshot";
import type { MockScenario } from "@/api/mock/scenarios";

function renderScreen(scenario: MockScenario) {
  render(
    <CandidatesScreen loader={() => consoleCandidatesFor(scenario)} />,
  );
}

describe("CandidatesScreen", () => {
  it("renders header, totals subtitle and 4-column table", async () => {
    renderScreen("normal");
    expect(
      await screen.findByRole("heading", {
        level: 1,
        name: /candidates/i,
      }),
    ).toBeDefined();
    // 9 candidates in the normal scenario; 8 awaiting enrollment
    // (everyone except CND-1042 which is `enrolled`).
    expect(
      await screen.findByText(/9 records · 8 awaiting enrollment/i),
    ).toBeDefined();
    expect(screen.getByRole("columnheader", { name: /candidate/i })).toBeDefined();
    expect(screen.getByRole("columnheader", { name: /masked dob/i })).toBeDefined();
    expect(screen.getByRole("columnheader", { name: /eligibility/i })).toBeDefined();
    expect(screen.getByRole("columnheader", { name: /face template/i })).toBeDefined();
  });

  it("disables the Register candidate action (out-of-scope for this feature)", async () => {
    renderScreen("normal");
    const btn = (await screen.findByRole("button", {
      name: /register candidate/i,
    })) as HTMLButtonElement;
    expect(btn.disabled).toBe(true);
  });

  it("filters via enrollment chips (In progress narrows to capturing/command-sent/ready-to-enroll/needs-retry)", async () => {
    renderScreen("normal");
    await screen.findAllByText("CND-1042");
    fireEvent.click(
      screen.getByRole("tab", { name: /^in progress$/i }),
    );
    // CND-1043 (capturing), CND-1044 (command-sent), CND-1045
    // (ready-to-enroll) and CND-1048 (needs-retry) should remain;
    // CND-1042 (enrolled) and CND-1047 (quality-failed) shouldn't.
    expect(screen.getAllByText("CND-1043").length).toBeGreaterThan(0);
    expect(screen.getAllByText("CND-1044").length).toBeGreaterThan(0);
    expect(screen.getAllByText("CND-1045").length).toBeGreaterThan(0);
    expect(screen.getAllByText("CND-1048").length).toBeGreaterThan(0);
    expect(screen.queryByText("CND-1042")).toBeNull();
    expect(screen.queryByText("CND-1047")).toBeNull();
  });

  it("filters by search substring across name, id and document", async () => {
    renderScreen("normal");
    await screen.findAllByText("CND-1042");
    const search = screen.getByRole("textbox", { name: /search/i });
    fireEvent.change(search, { target: { value: "lazar" } });
    expect(screen.getAllByText("CND-1046").length).toBeGreaterThan(0);
    expect(screen.queryByText("CND-1042")).toBeNull();

    // Document substring also matches.
    fireEvent.change(search, { target: { value: "DL-77-211" } });
    expect(screen.getAllByText("CND-1048").length).toBeGreaterThan(0);
    expect(screen.queryByText("CND-1042")).toBeNull();
  });

  it("renders empty state for the empty scenario", async () => {
    renderScreen("empty");
    expect(
      await screen.findByText(/No candidates in this scenario/i),
    ).toBeDefined();
  });

  it("opens detail with Identity dl + Face enrollment panel (no verification UI)", async () => {
    renderScreen("normal");
    await screen.findAllByText("CND-1042");
    fireEvent.click(screen.getByRole("button", { name: /K\. Lazareva/i }));
    const detail = screen.getByRole("complementary", {
      name: /Candidate CND-1046/i,
    });
    // Identity block.
    expect(within(detail).getByText(/^Identity$/i)).toBeDefined();
    expect(within(detail).getByText("DL-77-008822")).toBeDefined();
    expect(within(detail).getByText(/Masked DOB/i)).toBeDefined();
    expect(within(detail).getByText(/Last enrollment/i)).toBeDefined();
    // Face enrollment panel (NOT face verification).
    expect(
      within(detail).getByText(/^Face enrollment$/i),
    ).toBeDefined();
    // The enrollment-only note mentions "verification" in prose,
    // but no section title or heading labelled exactly
    // "Face verification" exists (legacy mixed-UI removed).
    expect(within(detail).queryByText(/^Face verification$/i)).toBeNull();
    expect(
      within(detail).getByText(/Template status/i),
    ).toBeDefined();
    expect(within(detail).getByText(/Source device/i)).toBeDefined();
    expect(
      within(detail).getByText(
        /Per-exam face verification and passive liveness checks/i,
      ),
    ).toBeDefined();
    // Action buttons disabled per spec.
    const startBtn = within(detail).getByRole("button", {
      name: /start enrollment/i,
    }) as HTMLButtonElement;
    expect(startBtn.disabled).toBe(true);
    const sessionsBtn = within(detail).getByRole("button", {
      name: /sessions/i,
    }) as HTMLButtonElement;
    expect(sessionsBtn.disabled).toBe(true);
  });

  it("represents all 9 enrollment states in the normal scenario fixtures", () => {
    const snapshot = consoleCandidatesFor("normal");
    const required: CandidateEnrollmentState[] = [
      "enrolled",
      "capturing",
      "command-sent",
      "ready-to-enroll",
      "not-enrolled",
      "quality-failed",
      "needs-retry",
      "device-unavailable",
      "session-expired",
    ];
    const present = new Set(
      snapshot.candidates.map((c: ConsoleCandidate) => c.enrollment.state),
    );
    for (const state of required) {
      expect(present.has(state)).toBe(true);
    }
  });

  it("renders Skeleton while loader is pending (R1 pattern)", () => {
    const pending = new Promise<never>(() => {});
    render(
      <CandidatesScreen
        loader={() => pending as unknown as ReturnType<typeof consoleCandidatesFor>}
      />,
    );
    expect(
      screen.getByRole("status", { name: /loading candidates/i }),
    ).toBeDefined();
  });

  it("renders ApiErrorView with retry when loader rejects (R1 pattern)", async () => {
    const error = Object.assign(new Error("loader failed"), {
      code: "LOADER_FAIL",
      status: 500,
    });
    render(
      <CandidatesScreen
        loader={() => Promise.reject(error)}
      />,
    );
    expect(
      await screen.findByText(/loader failed/i),
    ).toBeDefined();
    expect(
      screen.getByRole("button", { name: /try again|retry/i }),
    ).toBeDefined();
  });

  it("selects a row when its primary-cell button is activated (R2 pattern)", async () => {
    renderScreen("normal");
    await screen.findAllByText("CND-1042");
    const row = screen.getByRole("button", { name: /K\. Lazareva/i });
    fireEvent.click(row);
    expect(
      screen.getByRole("complementary", {
        name: /Candidate CND-1046/i,
      }),
    ).toBeDefined();
  });
});

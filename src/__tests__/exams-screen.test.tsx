import { describe, expect, it } from "vitest";
import { fireEvent, render, screen, within } from "@testing-library/react";

import { ExamsScreen } from "@/app/(shell)/exams/_components/ExamsScreen";
import { consoleExamsFor } from "@/app/(shell)/exams/_components/consoleExamsFixtures";
import type { MockScenario } from "@/api/mock/scenarios";

function renderScreen(scenario: MockScenario) {
  render(<ExamsScreen loader={() => consoleExamsFor(scenario)} />);
}

describe("ExamsScreen", () => {
  it("renders header with totals and the 5 filter tabs", async () => {
    renderScreen("normal");
    expect(
      await screen.findByRole("heading", { level: 1, name: /^exams$/i }),
    ).toBeDefined();
    expect(
      await screen.findByText(/1 in progress · 1 scheduled today/i),
    ).toBeDefined();
    const tablist = screen.getByRole("tablist", {
      name: /exam state filter/i,
    });
    expect(within(tablist).getAllByRole("tab")).toHaveLength(5);
  });

  it("disables Create exam (out-of-scope for design feature)", async () => {
    renderScreen("normal");
    const btn = (await screen.findByRole("button", {
      name: /create exam/i,
    })) as HTMLButtonElement;
    expect(btn.disabled).toBe(true);
  });

  it("filters table by clicking the In progress tab", async () => {
    renderScreen("normal");
    await screen.findAllByText("EXM-0118");
    fireEvent.click(
      screen.getByRole("tab", { name: /in progress/i }),
    );
    expect(
      screen.getAllByText("EXM-0118").length,
    ).toBeGreaterThan(0);
    expect(screen.queryByText("EXM-0117")).toBeNull();
    expect(screen.queryByText("EXM-0119")).toBeNull();
  });

  it("opens detail with metadata grid + lifecycle + timeline", async () => {
    renderScreen("normal");
    await screen.findAllByText("EXM-0118");
    fireEvent.click(
      screen.getByRole("button", { name: /EXM-0117/i }),
    );
    const detail = screen.getByRole("complementary", {
      name: /Exam EXM-0117/i,
    });
    expect(
      within(detail).getByText(/K\. Lazareva/i),
    ).toBeDefined();
    expect(within(detail).getByText(/Lifecycle/i)).toBeDefined();
    // Lifecycle buttons all disabled per scope.
    const startBtn = within(detail).getByRole("button", {
      name: /^start$/i,
    }) as HTMLButtonElement;
    expect(startBtn.disabled).toBe(true);
    const finishBtn = within(detail).getByRole("button", {
      name: /^finish$/i,
    }) as HTMLButtonElement;
    expect(finishBtn.disabled).toBe(true);
    const abortBtn = within(detail).getByRole("button", {
      name: /^abort$/i,
    }) as HTMLButtonElement;
    expect(abortBtn.disabled).toBe(true);
    // Timeline entries rendered.
    expect(within(detail).getByText(/Timeline/i)).toBeDefined();
    expect(within(detail).getByText(/Exam finished/i)).toBeDefined();
  });

  it("renders empty state for the empty scenario", async () => {
    renderScreen("empty");
    expect(
      await screen.findByText(/No exams in this scenario/i),
    ).toBeDefined();
  });

  it("renders Skeleton while loader is pending (R1 pattern)", () => {
    const pending = new Promise<never>(() => {});
    render(
      <ExamsScreen
        loader={() => pending as unknown as ReturnType<typeof consoleExamsFor>}
      />,
    );
    expect(
      screen.getByRole("status", { name: /loading exams/i }),
    ).toBeDefined();
  });

  it("renders ApiErrorView with retry when loader rejects (R1 pattern)", async () => {
    const error = Object.assign(new Error("loader failed"), {
      code: "LOADER_FAIL",
      status: 500,
    });
    render(<ExamsScreen loader={() => Promise.reject(error)} />);
    expect(
      await screen.findByText(/loader failed/i),
    ).toBeDefined();
    expect(
      screen.getByRole("button", { name: /try again|retry/i }),
    ).toBeDefined();
  });

  it("selects a row via the keyboard-accessible primary-cell button (R2 pattern)", async () => {
    renderScreen("normal");
    await screen.findAllByText("EXM-0118");
    fireEvent.click(screen.getByRole("button", { name: /EXM-0119/i }));
    expect(
      screen.getByRole("complementary", { name: /Exam EXM-0119/i }),
    ).toBeDefined();
  });
});

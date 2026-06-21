import { describe, expect, it } from "vitest";
import { fireEvent, render, screen, within } from "@testing-library/react";

import { ExercisesScreen } from "@/app/(shell)/exercises/_components/ExercisesScreen";
import { consoleExercisesFor } from "@/app/(shell)/exercises/_components/consoleExercisesFixtures";
import type { MockScenario } from "@/api/mock/scenarios";

function renderScreen(scenario: MockScenario) {
  render(<ExercisesScreen loader={() => consoleExercisesFor(scenario)} />);
}

describe("ExercisesScreen", () => {
  it("renders header with totals and the groups nav", async () => {
    renderScreen("normal");
    expect(
      await screen.findByRole("heading", { level: 1, name: /^exercises$/i }),
    ).toBeDefined();
    expect(
      await screen.findByText(/4 groups · 2 drafts/i),
    ).toBeDefined();
    const groupsNav = screen.getByRole("navigation", {
      name: /exercise groups/i,
    });
    expect(within(groupsNav).getByRole("button", { name: /^all/i })).toBeDefined();
    expect(within(groupsNav).getByRole("button", { name: /slalom/i })).toBeDefined();
  });

  it("disables New exercise (out-of-scope for design feature)", async () => {
    renderScreen("normal");
    const btn = (await screen.findByRole("button", {
      name: /new exercise/i,
    })) as HTMLButtonElement;
    expect(btn.disabled).toBe(true);
  });

  it("filters catalog by selecting a group", async () => {
    renderScreen("normal");
    await screen.findAllByText("EX-101");
    fireEvent.click(
      screen.getByRole("button", { name: /slalom/i }),
    );
    expect(screen.getAllByText("EX-201").length).toBeGreaterThan(0);
    expect(screen.queryByText("EX-101")).toBeNull();
    expect(screen.queryByText("EX-301")).toBeNull();
  });

  it("opens detail with parameters and disabled publish/edit", async () => {
    renderScreen("normal");
    await screen.findAllByText("EX-101");
    fireEvent.click(screen.getByRole("button", { name: /EX-302/i }));
    const detail = screen.getByRole("complementary", {
      name: /Exercise EX-302/i,
    });
    expect(within(detail).getByText(/Perpendicular parking/i)).toBeDefined();
    expect(within(detail).getByText(/Parameters/i)).toBeDefined();
    expect(within(detail).getByText(/Linked rule/i)).toBeDefined();
    const publishBtn = within(detail).getByRole("button", {
      name: /^publish$/i,
    }) as HTMLButtonElement;
    expect(publishBtn.disabled).toBe(true);
    const editBtn = within(detail).getByRole("button", {
      name: /^edit draft$/i,
    }) as HTMLButtonElement;
    expect(editBtn.disabled).toBe(true);
  });

  it("renders empty state for the empty scenario", async () => {
    renderScreen("empty");
    expect(
      await screen.findByText(/No exercises in this scenario/i),
    ).toBeDefined();
  });

  it("renders Skeleton while loader is pending (R1 pattern)", () => {
    const pending = new Promise<never>(() => {});
    render(
      <ExercisesScreen
        loader={() =>
          pending as unknown as ReturnType<typeof consoleExercisesFor>
        }
      />,
    );
    expect(
      screen.getByRole("status", { name: /loading exercises/i }),
    ).toBeDefined();
  });

  it("renders ApiErrorView with retry when loader rejects (R1 pattern)", async () => {
    const error = Object.assign(new Error("loader failed"), {
      code: "LOADER_FAIL",
      status: 500,
    });
    render(<ExercisesScreen loader={() => Promise.reject(error)} />);
    expect(
      await screen.findByText(/loader failed/i),
    ).toBeDefined();
    expect(
      screen.getByRole("button", { name: /try again|retry/i }),
    ).toBeDefined();
  });

  it("selects a row via the keyboard-accessible primary-cell button (R2 pattern)", async () => {
    renderScreen("normal");
    await screen.findAllByText("EX-101");
    fireEvent.click(screen.getByRole("button", { name: /EX-202/i }));
    expect(
      screen.getByRole("complementary", { name: /Exercise EX-202/i }),
    ).toBeDefined();
  });
});

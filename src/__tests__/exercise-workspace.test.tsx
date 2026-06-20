import { describe, expect, it } from "vitest";
import {
  fireEvent,
  render,
  screen,
  waitFor,
  waitForElementToBeRemoved,
} from "@testing-library/react";

import { createMockAdapter } from "@/api/mock/adapter";
import { ExerciseWorkspace } from "@/app/(shell)/exercises/_components/ExerciseWorkspace";

async function renderWorkspace(
  scenario: Parameters<typeof createMockAdapter>[0],
) {
  const api = createMockAdapter(scenario);
  render(<ExerciseWorkspace api={api} />);
  await waitForElementToBeRemoved(
    () => screen.queryByRole("status", { name: /loading exercises/i }),
    { timeout: 2000 },
  );
}

describe("ExerciseWorkspace", () => {
  it("renders catalog rows and groups for the normal scenario", async () => {
    await renderWorkspace("normal");
    expect(
      screen.getByRole("heading", { level: 1, name: /exercises/i }),
    ).toBeDefined();
    // findAllByRole awaits the useEffect-triggered re-render that copies
    // loader state into the local mutable list.
    const parkButtons = await screen.findAllByRole("button", {
      name: /EX-PARK-01/,
    });
    expect(parkButtons.length).toBeGreaterThan(0);
    expect(screen.getByText(/Showing 3 of 3/i)).toBeDefined();
  });

  it("filters by status", async () => {
    await renderWorkspace("normal");
    // wait until exercises are mirrored into local state
    await screen.findByText(/Showing 3 of 3/i);
    const statusSelect = screen.getByRole("combobox", {
      name: /^status$/i,
    }) as HTMLSelectElement;
    fireEvent.change(statusSelect, { target: { value: "draft" } });
    expect(screen.getByText(/Showing 1 of 3/i)).toBeDefined();
  });

  it("opens detail with publish action for a draft exercise", async () => {
    await renderWorkspace("normal");
    const buttons = await screen.findAllByRole("button", {
      name: /EX-LANE-01/,
    });
    fireEvent.click(buttons[0]);
    expect(
      screen.getByRole("complementary", { name: /Exercise EX-LANE-01/i }),
    ).toBeDefined();
    expect(
      screen.getByRole("button", { name: /^publish…$/i }),
    ).toBeDefined();
  });

  it("renders empty state for empty scenario", async () => {
    await renderWorkspace("empty");
    expect(
      await screen.findByText(/No exercises in this scenario/i),
    ).toBeDefined();
  });

  it("preserves code and title after publish (Codex R1)", async () => {
    await renderWorkspace("normal");
    const buttons = await screen.findAllByRole("button", {
      name: /EX-LANE-01/,
    });
    fireEvent.click(buttons[0]);

    // EX-LANE-01 is the draft exercise. Trigger publish flow.
    fireEvent.click(screen.getByRole("button", { name: /^publish…$/i }));
    fireEvent.click(
      screen.getByRole("button", { name: /^submit publish$/i }),
    );

    // After mock POST completes, detail panel must keep the original
    // identity fields (code/title) — i.e. mock response is full
    // contract-shaped Exercise and workspace patchExercise merges
    // partial updates instead of replacing.
    await waitFor(() => {
      expect(
        screen.getByRole("complementary", {
          name: /Exercise EX-LANE-01/i,
        }),
      ).toBeDefined();
    });
    // Title still on screen inside detail panel.
    expect(
      screen.getByRole("heading", { name: /Lane change/i }),
    ).toBeDefined();
  });
});

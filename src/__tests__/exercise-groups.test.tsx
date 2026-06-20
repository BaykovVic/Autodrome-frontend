import { describe, expect, it } from "vitest";
import {
  fireEvent,
  render,
  screen,
  waitFor,
  waitForElementToBeRemoved,
} from "@testing-library/react";

import { createMockAdapter } from "@/api/mock/adapter";
import { selectFixtures } from "@/api/mock/fixtures";
import { ExerciseGroupsSection } from "@/app/(shell)/exercises/_components/ExerciseGroupsSection";

async function renderSection(
  scenario: Parameters<typeof createMockAdapter>[0],
) {
  const api = createMockAdapter(scenario);
  const exercises = selectFixtures(scenario).exercises;
  render(<ExerciseGroupsSection api={api} exercises={exercises} />);
  await waitForElementToBeRemoved(
    () =>
      screen.queryByRole("status", { name: /loading exercise groups/i }),
    { timeout: 2000 },
  );
}

describe("ExerciseGroupsSection", () => {
  it("renders existing groups from the mock", async () => {
    await renderSection("normal");
    // findByText awaits the useEffect-mirrored list render.
    expect(
      await screen.findByText("Autodrome basic — full pass"),
    ).toBeDefined();
    expect(
      screen.getByText("Autodrome advanced — full pass"),
    ).toBeDefined();
  });

  it("creates a new group via mock POST", async () => {
    await renderSection("normal");
    fireEvent.click(screen.getByRole("button", { name: /^new group…$/i }));

    fireEvent.change(
      screen.getByRole("textbox", { name: /group title/i }),
      { target: { value: "Test group" } },
    );

    const checkboxes = screen.getAllByRole("checkbox");
    fireEvent.click(checkboxes[0]);

    fireEvent.click(
      screen.getByRole("button", { name: /^create group$/i }),
    );

    await waitFor(() =>
      expect(screen.getByText(/New group id/i)).toBeDefined(),
    );
  });

  it("blocks submit when no exercises picked", async () => {
    await renderSection("normal");
    fireEvent.click(screen.getByRole("button", { name: /^new group…$/i }));
    fireEvent.change(
      screen.getByRole("textbox", { name: /group title/i }),
      { target: { value: "Bad group" } },
    );
    fireEvent.click(
      screen.getByRole("button", { name: /^create group$/i }),
    );
    expect(
      screen.getByText(/Select at least one published exercise/i),
    ).toBeDefined();
  });
});

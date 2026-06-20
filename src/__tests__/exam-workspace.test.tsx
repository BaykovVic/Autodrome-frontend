import { describe, expect, it } from "vitest";
import {
  fireEvent,
  render,
  screen,
  waitForElementToBeRemoved,
} from "@testing-library/react";

import { createMockAdapter } from "@/api/mock/adapter";
import { selectFixtures } from "@/api/mock/fixtures";
import type { MockScenario } from "@/api/mock/scenarios";
import { ExamWorkspace } from "@/app/(shell)/exams/_components/ExamWorkspace";

async function renderWorkspace(scenario: MockScenario) {
  const api = createMockAdapter(scenario);
  const fixtures = selectFixtures(scenario);
  render(<ExamWorkspace api={api} loader={() => fixtures.exams} />);
  await waitForElementToBeRemoved(
    () => screen.queryByRole("status", { name: /loading exams/i }),
    { timeout: 2000 },
  );
}

describe("ExamWorkspace", () => {
  it("renders exams list and detail with timeline placeholder", async () => {
    await renderWorkspace("normal");
    expect(
      screen.getByRole("heading", { level: 1, name: /exams/i }),
    ).toBeDefined();

    expect(screen.getByText(/Showing 2 of 2/i)).toBeDefined();

    const buttons = screen.getAllByRole("button");
    const examButton = buttons.find((b) => /^3000000/.test(b.textContent ?? ""));
    expect(examButton).toBeDefined();
    fireEvent.click(examButton!);

    expect(screen.getByText(/Timeline placeholder/i)).toBeDefined();
  });

  it("filters by status", async () => {
    await renderWorkspace("exam-in-progress");
    const statusSelect = screen.getByLabelText(/^status$/i) as HTMLSelectElement;
    fireEvent.change(statusSelect, { target: { value: "inProgress" } });

    expect(screen.getByText(/Showing 1 of 2/i)).toBeDefined();
  });

  it("renders empty state when scenario is empty", async () => {
    await renderWorkspace("empty");
    expect(
      screen.getByText(/No exams in this scenario/i),
    ).toBeDefined();
    expect(screen.getByText(/Showing 0 of 0/i)).toBeDefined();
  });
});

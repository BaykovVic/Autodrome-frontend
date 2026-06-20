import { describe, expect, it } from "vitest";
import {
  fireEvent,
  render,
  screen,
  waitForElementToBeRemoved,
} from "@testing-library/react";

import { createMockAdapter } from "@/api/mock/adapter";
import { CandidateWorkspace } from "@/app/(shell)/candidates/_components/CandidateWorkspace";

async function renderWorkspace(
  scenario: Parameters<typeof createMockAdapter>[0],
) {
  const api = createMockAdapter(scenario);
  render(<CandidateWorkspace api={api} />);
  await waitForElementToBeRemoved(
    () => screen.queryByRole("status", { name: /loading candidates/i }),
    { timeout: 2000 },
  );
}

describe("CandidateWorkspace", () => {
  it("renders a list of candidates for the normal scenario", async () => {
    await renderWorkspace("normal");
    expect(
      screen.getByRole("heading", { level: 1, name: /candidates/i }),
    ).toBeDefined();
    expect(screen.getByText("Petrova Anna")).toBeDefined();
    expect(screen.getByText("Ivanov Boris")).toBeDefined();
    expect(screen.getByText(/Showing 2 of 2/i)).toBeDefined();
  });

  it("narrows the list when search filter is applied", async () => {
    await renderWorkspace("normal");
    const search = screen.getByLabelText(/search/i) as HTMLInputElement;
    fireEvent.change(search, { target: { value: "Petr" } });

    expect(screen.queryByText("Ivanov Boris")).toBeNull();
    expect(screen.getByText("Petrova Anna")).toBeDefined();
    expect(screen.getByText(/Showing 1 of 2/i)).toBeDefined();
  });

  it("opens the detail panel when a candidate name is clicked", async () => {
    await renderWorkspace("normal");
    const nameBtn = screen.getByRole("button", { name: /Petrova Anna/i });
    fireEvent.click(nameBtn);

    const detail = screen.getByRole("complementary", {
      name: /Candidate Anna Petrova/i,
    });
    expect(detail).toBeDefined();
    expect(
      screen.getByRole("button", { name: /close detail/i }),
    ).toBeDefined();
  });

  it("renders empty state when filters match nothing", async () => {
    await renderWorkspace("normal");
    const search = screen.getByLabelText(/search/i) as HTMLInputElement;
    fireEvent.change(search, { target: { value: "no-such-name" } });

    expect(
      screen.getByText(/No candidates match current filters/i),
    ).toBeDefined();
  });

  it("renders EmptyState in the empty scenario", async () => {
    await renderWorkspace("empty");
    expect(
      screen.getByText(/No candidates in this scenario/i),
    ).toBeDefined();
    expect(screen.getByText(/Showing 0 of 0/i)).toBeDefined();
  });
});

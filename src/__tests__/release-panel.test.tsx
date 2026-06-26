import { describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";

vi.mock("next/navigation", () => ({
  usePathname: () => "/operations",
}));

import { ReleasePanel } from "@/app/(shell)/operations/_components/ReleasePanel";

describe("ReleasePanel", () => {
  it("renders heading + read-only subtitle", () => {
    render(<ReleasePanel />);
    expect(
      screen.getByRole("region", { name: /release artifact hand-off/i }),
    ).toBeDefined();
    expect(
      screen.getByRole("heading", {
        name: /release artifact hand-off/i,
      }),
    ).toBeDefined();
  });

  it("surfaces build metadata block with framework version", () => {
    render(<ReleasePanel />);
    expect(screen.getByText(/Next\.js/i)).toBeDefined();
    expect(screen.getByText(/v16\.2\.9/i)).toBeDefined();
    expect(screen.getByText(/v19\.2\.4/i)).toBeDefined();
  });

  it("links to RELEASE_CANDIDATE_CHECKLIST.md artifact path", () => {
    render(<ReleasePanel />);
    expect(
      screen.getAllByText(/RELEASE_CANDIDATE_CHECKLIST\.md/i).length,
    ).toBeGreaterThan(0);
    const list = screen.getByRole("list", {
      name: /release checklist highlights/i,
    });
    expect(list).toBeDefined();
  });

  it("hand-off list surfaces deploy hand-off API as degraded", () => {
    render(<ReleasePanel />);
    const list = screen.getByRole("list", {
      name: /release hand-off entries/i,
    });
    expect(list).toBeDefined();
    expect(
      screen.getAllByText(/Deploy hand-off API/i).length,
    ).toBeGreaterThan(0);
    expect(screen.getAllByText(/Degraded/i).length).toBeGreaterThan(0);
  });

  it("surfaces explicit degraded note about deploy contract gap", () => {
    render(<ReleasePanel />);
    const statuses = screen.getAllByRole("status");
    const text = statuses.map((s) => s.textContent ?? "").join(" ");
    expect(text).toMatch(/deployment-operations-service/i);
  });
});

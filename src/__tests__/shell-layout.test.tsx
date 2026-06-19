import { describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";

vi.mock("next/navigation", () => ({
  usePathname: () => "/dashboard",
}));

import ShellLayout from "@/app/(shell)/layout";

describe("ShellLayout", () => {
  it("renders the primary sidebar navigation", () => {
    render(
      <ShellLayout>
        <div data-testid="content">placeholder body</div>
      </ShellLayout>,
    );
    expect(
      screen.getByRole("navigation", { name: /primary/i }),
    ).toBeDefined();
  });

  it("renders provided children inside the main content area", () => {
    render(
      <ShellLayout>
        <div data-testid="content">placeholder body</div>
      </ShellLayout>,
    );
    expect(screen.getByTestId("content").textContent).toBe(
      "placeholder body",
    );
  });
});

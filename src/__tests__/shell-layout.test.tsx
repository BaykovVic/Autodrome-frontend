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

  it("renders the console topbar and sidebar storage footer", () => {
    render(
      <ShellLayout>
        <div data-testid="content">placeholder body</div>
      </ShellLayout>,
    );
    expect(
      screen.getByRole("banner", { name: /console topbar/i }),
    ).toBeDefined();
    expect(
      screen.getByRole("progressbar", {
        name: /node storage usage/i,
      }),
    ).toBeDefined();
  });

  it("renders provided children inside the main content area once the session is authenticated", async () => {
    render(
      <ShellLayout>
        <div data-testid="content">placeholder body</div>
      </ShellLayout>,
    );
    // Content is gated by the session shell; the default mock scenario
    // authenticates, so the children appear after the session resolves.
    const content = await screen.findByTestId("content");
    expect(content.textContent).toBe("placeholder body");
  });
});

import { describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";

vi.mock("next/navigation", () => ({
  usePathname: () => "/candidates",
}));

import {
  SHELL_ROUTES,
  SidebarNav,
} from "@/app/(shell)/_components/SidebarNav";

describe("SidebarNav", () => {
  it("renders one link per shell route", () => {
    render(<SidebarNav />);
    const links = screen.getAllByRole("link");
    expect(links).toHaveLength(SHELL_ROUTES.length);
  });

  it("marks the link matching usePathname as the active route", () => {
    render(<SidebarNav />);
    const links = screen.getAllByRole("link");
    const active = links.filter(
      (link) => link.getAttribute("aria-current") === "page",
    );
    expect(active).toHaveLength(1);
    expect(active[0].textContent).toBe("Candidates");
  });
});

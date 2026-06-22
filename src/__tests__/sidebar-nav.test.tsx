import { describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";

vi.mock("next/navigation", () => ({
  usePathname: () => "/candidates",
}));

import {
  SHELL_NAV_GROUPS,
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

  it("renders REGISTRY / CONFIGURATION / SYSTEM section headings", () => {
    render(<SidebarNav />);
    for (const group of SHELL_NAV_GROUPS) {
      if (group.heading === null) continue;
      expect(screen.getByText(group.heading)).toBeDefined();
    }
  });

  it("keeps SHELL_ROUTES in sync with SHELL_NAV_GROUPS", () => {
    const flattened = SHELL_NAV_GROUPS.flatMap((g) => g.routes);
    expect(flattened).toEqual(SHELL_ROUTES);
  });

  it("renders an SVG icon inside every route link (web-operator-console reference alignment)", () => {
    render(<SidebarNav />);
    const links = screen.getAllByRole("link");
    for (const link of links) {
      const svg = link.querySelector("svg");
      expect(svg).not.toBeNull();
      expect(svg?.getAttribute("aria-hidden")).toBe("true");
    }
  });
});

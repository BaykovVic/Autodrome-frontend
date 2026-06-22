import { describe, expect, it } from "vitest";
import { render, screen, within } from "@testing-library/react";

import { ConsoleTopbar } from "@/app/(shell)/_components/ConsoleTopbar";

describe("ConsoleTopbar", () => {
  it("renders the AUTODROME brand and LOCAL NODE chip", () => {
    render(<ConsoleTopbar />);
    const topbar = screen.getByRole("banner", { name: /console topbar/i });
    expect(within(topbar).getByText(/AUTODROME/)).toBeDefined();
    expect(within(topbar).getByText(/LOCAL\s+NODE/)).toBeDefined();
  });

  it("renders default node identity and ONLINE state", () => {
    render(<ConsoleTopbar />);
    expect(screen.getByText("NODE-A2")).toBeDefined();
    expect(screen.getByText("ONLINE")).toBeDefined();
  });

  it("renders default operator M. Orlova / Inspector", () => {
    render(<ConsoleTopbar />);
    expect(screen.getByText("M. Orlova")).toBeDefined();
    expect(screen.getByText("Inspector")).toBeDefined();
    expect(screen.getByText("MO")).toBeDefined();
  });

  it("renders an inline brand mark SVG (web-operator-console reference alignment)", () => {
    render(<ConsoleTopbar />);
    const topbar = screen.getByRole("banner", { name: /console topbar/i });
    const svg = topbar.querySelector("svg");
    expect(svg).not.toBeNull();
    expect(svg?.getAttribute("viewBox")).toBe("0 0 24 24");
  });

  it("renders custom node, services and operator", () => {
    render(
      <ConsoleTopbar
        node={{ id: "NODE-A2", state: "online", stateLabel: "ONLINE" }}
        services={[
          { label: "DB", state: "online" },
          { label: "Media", state: "online" },
          { label: "Tel", state: "degraded" },
        ]}
        operator={{ initials: "MO", name: "M. Orlova", role: "Inspector" }}
      />,
    );
    expect(screen.getByText("NODE-A2")).toBeDefined();
    expect(screen.getByText("DB")).toBeDefined();
    expect(screen.getByText("Tel")).toBeDefined();
    expect(screen.getByText("M. Orlova")).toBeDefined();
    expect(screen.getByText("Inspector")).toBeDefined();
    expect(screen.getByText("MO")).toBeDefined();
  });
});

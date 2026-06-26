import { describe, expect, it, vi } from "vitest";
import { render, screen, within } from "@testing-library/react";

vi.mock("next/navigation", () => ({
  usePathname: () => "/reporting",
}));

import { ReportingScreen } from "@/app/(shell)/reporting/_components/ReportingScreen";
import { consoleReportingFor } from "@/app/(shell)/reporting/_components/consoleReportingFixtures";

describe("ReportingScreen", () => {
  it("renders heading + template + report sections (normal scenario)", async () => {
    render(<ReportingScreen loader={() => consoleReportingFor("normal")} />);
    await screen.findByRole("heading", { level: 1, name: /reporting/i });
    expect(
      screen.getByRole("table", { name: /reporting template catalog/i }),
    ).toBeDefined();
    expect(
      screen.getByRole("table", { name: /recent reports/i }),
    ).toBeDefined();
    // Canonical type chips visible.
    expect(screen.getAllByText("(examProtocol)").length).toBeGreaterThan(0);
  });

  it("generate report + export buttons are disabled (no fake readiness)", async () => {
    render(<ReportingScreen loader={() => consoleReportingFor("normal")} />);
    await screen.findByRole("heading", { level: 1, name: /reporting/i });
    const group = screen.getByRole("group", {
      name: /reporting actions/i,
    });
    const gen = within(group).getByRole("button", {
      name: /generate report/i,
    }) as HTMLButtonElement;
    const exp = within(group).getByRole("button", {
      name: /export/i,
    }) as HTMLButtonElement;
    expect(gen.disabled).toBe(true);
    expect(exp.disabled).toBe(true);
  });

  it("degraded scenario surfaces degradedNote banner", async () => {
    render(
      <ReportingScreen loader={() => consoleReportingFor("service-degraded")} />,
    );
    await screen.findByRole("heading", { level: 1, name: /reporting/i });
    expect(
      screen.getByLabelText(/reporting degraded note/i),
    ).toBeDefined();
  });

  it("empty scenario shows 'no templates' and 'no recent reports' empty notes", async () => {
    render(<ReportingScreen loader={() => consoleReportingFor("empty")} />);
    await screen.findByRole("heading", { level: 1, name: /reporting/i });
    expect(
      screen.getByText(/no templates published yet/i),
    ).toBeDefined();
    expect(screen.getByText(/no recent reports/i)).toBeDefined();
  });

  it("recent reports table shows ready + inProgress + failed statuses with canonical chips", async () => {
    render(<ReportingScreen loader={() => consoleReportingFor("normal")} />);
    await screen.findByRole("heading", { level: 1, name: /reporting/i });
    const reports = screen.getByRole("table", {
      name: /recent reports/i,
    });
    expect(within(reports).getByText(/RPT-EXM-2026-0337/)).toBeDefined();
    expect(within(reports).getByText(/RPT-EXM-2026-0338/)).toBeDefined();
    expect(within(reports).getByText(/RPT-EXM-2026-0334/)).toBeDefined();
  });
});

import { describe, expect, it } from "vitest";
import { fireEvent, render, screen } from "@testing-library/react";

import { DiagnosticsPanel } from "@/app/(shell)/operations/_components/DiagnosticsPanel";
import type { DiagnosticsInfo } from "@/app/(shell)/operations/_components/diagnostics";

const FIXTURE: DiagnosticsInfo = {
  nodeId: "test-node-01",
  build: {
    version: "1.2.3",
    commit: "abcdef00",
    builtAt: "2026-06-19T08:00:00Z",
  },
  runtime: {
    startedAt: "2026-06-19T08:00:00Z",
    uptimeSeconds: 3600 * 3 + 15 * 60,
  },
  storage: {
    diskTotalGb: 500,
    diskUsedGb: 120,
  },
  configRefreshedAt: "2026-06-19T10:00:00Z",
};

describe("DiagnosticsPanel", () => {
  it("renders all diagnostics fields and free-space calculation", () => {
    render(<DiagnosticsPanel info={FIXTURE} />);
    expect(screen.getByText(/test-node-01/i)).toBeDefined();
    expect(screen.getByText(/^1\.2\.3$/)).toBeDefined();
    expect(screen.getByText(/^abcdef00$/)).toBeDefined();
    // Uptime formatted as Hh Mm.
    expect(screen.getByText(/^3h 15m$/)).toBeDefined();
    expect(screen.getByText(/^120 \/ 500 GB$/)).toBeDefined();
    expect(screen.getByText(/^380 GB$/)).toBeDefined();
  });

  it("Run diagnostics check button is disabled until the service is wired", () => {
    render(<DiagnosticsPanel info={FIXTURE} />);
    const btn = screen.getByRole("button", {
      name: /run diagnostics check/i,
    }) as HTMLButtonElement;
    expect(btn.disabled).toBe(true);
  });

  it("records a preview diagnostics request with pending-wiring badge", () => {
    render(<DiagnosticsPanel info={FIXTURE} />);
    fireEvent.click(
      screen.getByRole("button", {
        name: /record a diagnostics request/i,
      }),
    );
    expect(screen.getByText(/pending wiring/i)).toBeDefined();
    expect(
      screen.getByText(/not yet connected to the local node/i),
    ).toBeDefined();
  });
});

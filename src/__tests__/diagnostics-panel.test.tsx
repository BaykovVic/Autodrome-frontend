import { describe, expect, it } from "vitest";
import { fireEvent, render, screen, within } from "@testing-library/react";

import {
  DEFAULT_LIVE_BASE_URLS,
  type RuntimeDiagnostics,
} from "@/api/runtime-config";
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

  it("shows mock mode and scenario in the runtime section", () => {
    const runtime: RuntimeDiagnostics = {
      mode: "mock",
      scenario: "violations-detected",
    };
    render(<DiagnosticsPanel info={FIXTURE} runtime={runtime} />);
    const section = screen.getByRole("region", {
      name: /runtime api mode/i,
    });
    expect(within(section).getByText(/^mock$/i)).toBeDefined();
    expect(
      within(section).getByText(/violations-detected/i),
    ).toBeDefined();
    expect(
      within(section).getByText(/No real backend is contacted/i),
    ).toBeDefined();
  });

  it("shows live mode with all configured base URLs", () => {
    const runtime: RuntimeDiagnostics = {
      mode: "live",
      ok: true,
      baseUrls: DEFAULT_LIVE_BASE_URLS,
    };
    render(<DiagnosticsPanel info={FIXTURE} runtime={runtime} />);
    const section = screen.getByRole("region", {
      name: /runtime api mode/i,
    });
    expect(within(section).getByText(/^live$/i)).toBeDefined();
    expect(
      within(section).getByText("/api/candidate/v1"),
    ).toBeDefined();
    expect(
      within(section).getByText("/api/media-archive/v1"),
    ).toBeDefined();
  });

  it("shows degraded live mode with issues and fallback URLs", () => {
    const runtime: RuntimeDiagnostics = {
      mode: "live",
      ok: false,
      baseUrls: DEFAULT_LIVE_BASE_URLS,
      issues: [
        {
          field: "NEXT_PUBLIC_API_EXAM_BASE_URL",
          message: "Invalid base URL for exam-service.",
        },
      ],
    };
    render(<DiagnosticsPanel info={FIXTURE} runtime={runtime} />);
    const section = screen.getByRole("region", {
      name: /runtime api mode/i,
    });
    expect(within(section).getByText(/^live$/i)).toBeDefined();
    expect(
      within(section).getByText(/Live mode is degraded/i),
    ).toBeDefined();
    expect(
      within(section).getAllByText(/NEXT_PUBLIC_API_EXAM_BASE_URL/)
        .length,
    ).toBeGreaterThan(0);
    // The defaults are still shown so the operator sees the
    // actual URL that will be used after the fallback.
    expect(
      within(section).getByText("/api/exam/v1"),
    ).toBeDefined();
  });

  it("does not leak raw credentials anywhere in the panel when live URLs contain userinfo or credential-like query params", () => {
    const runtime: RuntimeDiagnostics = {
      mode: "live",
      ok: true,
      baseUrls: {
        ...DEFAULT_LIVE_BASE_URLS,
        candidate:
          "https://alice:s3cret@api.example.local/api/candidate/v1?token=abc",
      },
    };
    const { container } = render(
      <DiagnosticsPanel info={FIXTURE} runtime={runtime} />,
    );
    const html = container.innerHTML;
    // None of the raw credentials must appear in the rendered DOM,
    // including the existing Runtime API mode URL list and the new
    // Service endpoints table.
    expect(html.includes("alice")).toBe(false);
    expect(html.includes("s3cret")).toBe(false);
    expect(html.includes("token=abc")).toBe(false);
    // Redaction markers must be present.
    expect(html).toMatch(/\*\*\*@api\.example\.local/);
    expect(html).toMatch(/token=\*\*\*/);
  });
});

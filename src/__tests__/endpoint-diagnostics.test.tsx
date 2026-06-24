import { describe, expect, it, vi } from "vitest";
import { fireEvent, render, screen, waitFor, within } from "@testing-library/react";

import {
  DEFAULT_LIVE_BASE_URLS,
  type RuntimeDiagnostics,
} from "@/api/runtime-config";
import { EndpointDiagnostics } from "@/app/(shell)/operations/_components/EndpointDiagnostics";
import type { ProbeResult } from "@/api/probe-endpoint";

const MOCK_RUNTIME: RuntimeDiagnostics = {
  mode: "mock",
  scenario: "normal",
};

const LIVE_OK_RUNTIME: RuntimeDiagnostics = {
  mode: "live",
  ok: true,
  baseUrls: {
    ...DEFAULT_LIVE_BASE_URLS,
    candidate: "https://api.example.local/api/candidate/v1",
  },
};

const LIVE_DEGRADED_RUNTIME: RuntimeDiagnostics = {
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

describe("EndpointDiagnostics", () => {
  it("renders one row per service in mock mode with disabled probe", () => {
    render(<EndpointDiagnostics runtime={MOCK_RUNTIME} />);
    const section = screen.getByRole("region", {
      name: /service endpoint diagnostics/i,
    });
    // 6 service rows.
    expect(
      within(section).getAllByText(/^mock$/i).length,
    ).toBeGreaterThanOrEqual(6);
    // "n/a" badge in the configured column for every row.
    expect(
      within(section).getAllByText(/^n\/a$/i).length,
    ).toBeGreaterThanOrEqual(6);
    const checkBtns = within(section).getAllByRole("button", {
      name: /check reachability/i,
    }) as HTMLButtonElement[];
    expect(checkBtns).toHaveLength(7);
    for (const btn of checkBtns) {
      expect(btn.disabled).toBe(true);
    }
    expect(
      within(section).getByText(/Mock mode shows the default base URLs/i),
    ).toBeDefined();
  });

  it("shows configured/default badges in live mode and enables probe", () => {
    render(<EndpointDiagnostics runtime={LIVE_OK_RUNTIME} />);
    const section = screen.getByRole("region", {
      name: /service endpoint diagnostics/i,
    });
    // One configured override, six defaults. The column header
    // "Configured" also matches /^configured$/i, hence +1.
    expect(
      within(section).getAllByText(/^configured$/i),
    ).toHaveLength(2);
    expect(
      within(section).getAllByText(/^default$/i),
    ).toHaveLength(6);
    const checkBtns = within(section).getAllByRole("button", {
      name: /check reachability/i,
    }) as HTMLButtonElement[];
    expect(checkBtns).toHaveLength(7);
    for (const btn of checkBtns) {
      expect(btn.disabled).toBe(false);
    }
  });

  it("shows degraded note when live config has issues", () => {
    render(<EndpointDiagnostics runtime={LIVE_DEGRADED_RUNTIME} />);
    expect(
      screen.getByText(/Reachability checks below run against the fallback/i),
    ).toBeDefined();
  });

  it("sanitizes credentials in the rendered base URL", () => {
    const runtime: RuntimeDiagnostics = {
      mode: "live",
      ok: true,
      baseUrls: {
        ...DEFAULT_LIVE_BASE_URLS,
        candidate: "https://alice:s3cret@api.example.local/v1?token=abc",
      },
    };
    render(<EndpointDiagnostics runtime={runtime} />);
    // Original credentials must not appear anywhere in the DOM.
    expect(screen.queryByText(/alice/)).toBeNull();
    expect(screen.queryByText(/s3cret/)).toBeNull();
    expect(screen.queryByText(/token=abc/)).toBeNull();
    // Redaction markers do appear.
    expect(screen.getByText(/\*\*\*@api\.example\.local/)).toBeDefined();
    expect(screen.getByText(/token=\*\*\*/)).toBeDefined();
  });

  it("runs probe and records a reachable result on click", async () => {
    const probe = vi
      .fn<(url: string) => Promise<ProbeResult>>()
      .mockResolvedValue({
        state: "reachable",
        httpStatus: 200,
        checkedAt: "2026-06-21T10:00:00Z",
      });
    render(
      <EndpointDiagnostics runtime={LIVE_OK_RUNTIME} probe={probe} />,
    );
    const section = screen.getByRole("region", {
      name: /service endpoint diagnostics/i,
    });
    const buttons = within(section).getAllByRole("button", {
      name: /check reachability/i,
    });
    fireEvent.click(buttons[0]);
    await waitFor(() => expect(probe).toHaveBeenCalledTimes(1));
    expect(
      within(section).getByText(/reachable · 200/),
    ).toBeDefined();
    expect(
      within(section).getByText(/2026-06-21T10:00:00Z/),
    ).toBeDefined();
  });

  it("does not call probe in mock mode even if user clicks", () => {
    const probe = vi.fn();
    render(<EndpointDiagnostics runtime={MOCK_RUNTIME} probe={probe} />);
    const buttons = screen.getAllByRole("button", {
      name: /check reachability/i,
    });
    // Buttons are disabled; fireEvent.click on a disabled button is
    // still a no-op for handlers in jsdom.
    fireEvent.click(buttons[0]);
    expect(probe).not.toHaveBeenCalled();
  });
});

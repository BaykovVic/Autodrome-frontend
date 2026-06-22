import { describe, expect, it, vi } from "vitest";
import { fireEvent, render, screen, within } from "@testing-library/react";

vi.mock("next/navigation", () => ({
  useRouter: () => ({
    push: vi.fn(),
    replace: vi.fn(),
    refresh: vi.fn(),
    back: vi.fn(),
    forward: vi.fn(),
    prefetch: vi.fn(),
  }),
  usePathname: () => "/candidates/sessions/ENR-9F41",
}));

import { EnrollmentSessionMonitor } from "@/app/(shell)/candidates/_components/EnrollmentSessionMonitor";
import {
  consoleEnrollmentSessionFor,
  ENROLLMENT_SESSION_SCENARIOS,
} from "@/app/(shell)/candidates/_components/consoleEnrollmentSessionFixtures";
import type {
  EnrollmentSessionScenario,
  EnrollmentSessionState,
} from "@/app/(shell)/candidates/_components/consoleEnrollmentSession";

function renderMonitor(scenario: EnrollmentSessionScenario) {
  render(
    <EnrollmentSessionMonitor
      loader={() => consoleEnrollmentSessionFor(scenario)}
    />,
  );
}

describe("EnrollmentSessionMonitor", () => {
  it("renders header with ENR id, state badge and TTL for the default capturing scenario", async () => {
    renderMonitor("capturing");
    expect(
      await screen.findByRole("heading", {
        level: 1,
        name: /enrollment session/i,
      }),
    ).toBeDefined();
    expect(screen.getByText("ENR-9F41")).toBeDefined();
    // "Capturing" appears in the state badge and in the timeline —
    // assert at least one rendering exists.
    expect(screen.getAllByText(/^Capturing$/).length).toBeGreaterThan(0);
    expect(screen.getByText(/TTL 02:43/)).toBeDefined();
  });

  it("renders breadcrumb back to the candidates registry", async () => {
    renderMonitor("capturing");
    await screen.findByText("ENR-9F41");
    const link = screen.getByRole("link", { name: /candidates registry/i });
    expect(link.getAttribute("href")).toBe("/candidates");
  });

  it("renders session facts (candidate, channel, target device, last event)", async () => {
    renderMonitor("capturing");
    await screen.findByText("ENR-9F41");
    const facts = screen.getByRole("region", {
      name: /session facts/i,
    });
    expect(within(facts).getByText(/Irina Volkova/)).toBeDefined();
    expect(within(facts).getByText("CND-2026-0144")).toBeDefined();
    expect(within(facts).getByText(/Registrar tablet/i)).toBeDefined();
    expect(within(facts).getByText("REG-TAB-02")).toBeDefined();
    expect(within(facts).getByText(/Station B · online/i)).toBeDefined();
    expect(within(facts).getByText("09:41:18")).toBeDefined();
  });

  it("renders the audit timeline with one entry per emitted state", async () => {
    renderMonitor("ttl-warning");
    await screen.findByText("ENR-9F41");
    const timeline = screen.getByRole("region", {
      name: /session timeline · audit/i,
    });
    expect(within(timeline).getByText(/Command queued/)).toBeDefined();
    expect(within(timeline).getByText(/Registrar accepted/)).toBeDefined();
    expect(within(timeline).getByText(/^Capturing$/)).toBeDefined();
    expect(within(timeline).getByText(/TTL warning/)).toBeDefined();
  });

  it("Retry on capturing is disabled (nothing to retry yet)", async () => {
    renderMonitor("capturing");
    await screen.findByText("ENR-9F41");
    const retry = screen.getByRole("button", {
      name: /^retry$/i,
    }) as HTMLButtonElement;
    expect(retry.disabled).toBe(true);
    expect(retry.getAttribute("title") ?? "").toMatch(
      /only available when the session is queued/i,
    );
  });

  it("Retry on quality-failed transitions state to queued · retry and appends a timeline entry", async () => {
    renderMonitor("quality-failed");
    await screen.findByText("ENR-9F41");
    const retry = screen.getByRole("button", {
      name: /^retry$/i,
    }) as HTMLButtonElement;
    expect(retry.disabled).toBe(false);
    fireEvent.click(retry);
    expect(screen.getByText(/Queued · retry/)).toBeDefined();
    expect(screen.getByText(/Retry queued in the local mock/)).toBeDefined();
    const timeline = screen.getByRole("region", {
      name: /session timeline · audit/i,
    });
    expect(within(timeline).getByText(/Retry queued/)).toBeDefined();
  });

  it("Cancel on capturing transitions state to cancelled and appends a timeline entry", async () => {
    renderMonitor("capturing");
    await screen.findByText("ENR-9F41");
    const cancel = screen.getByRole("button", {
      name: /cancel session/i,
    }) as HTMLButtonElement;
    expect(cancel.disabled).toBe(false);
    fireEvent.click(cancel);
    expect(screen.getAllByText(/^Cancelled$/i).length).toBeGreaterThan(0);
    expect(
      screen.getByText(/Session cancelled in the local mock/),
    ).toBeDefined();
    const timeline = screen.getByRole("region", {
      name: /session timeline · audit/i,
    });
    expect(
      within(timeline).getAllByText(/Cancelled/).length,
    ).toBeGreaterThan(0);
  });

  it("disables both Retry and Cancel on the finalized terminal state with visible reason", async () => {
    renderMonitor("finalized");
    await screen.findByText("ENR-9F41");
    const retry = screen.getByRole("button", {
      name: /^retry$/i,
    }) as HTMLButtonElement;
    const cancel = screen.getByRole("button", {
      name: /cancel session/i,
    }) as HTMLButtonElement;
    expect(retry.disabled).toBe(true);
    expect(cancel.disabled).toBe(true);
    expect(
      screen.getByRole("note", {
        // matches actionsNote
      }),
    ).toBeDefined();
  });

  it("disables both Retry and Cancel on the expired and cancelled terminal states", async () => {
    for (const scenario of ["expired", "cancelled"] as const) {
      const { unmount } = render(
        <EnrollmentSessionMonitor
          loader={() => consoleEnrollmentSessionFor(scenario)}
        />,
      );
      const retry = await screen.findByRole("button", {
        name: /^retry$/i,
      });
      expect((retry as HTMLButtonElement).disabled).toBe(true);
      const cancel = screen.getByRole("button", {
        name: /cancel session/i,
      });
      expect((cancel as HTMLButtonElement).disabled).toBe(true);
      unmount();
    }
  });

  it("renders Skeleton while loader is pending (R1 pattern)", () => {
    const pending = new Promise<never>(() => {});
    render(
      <EnrollmentSessionMonitor
        loader={() =>
          pending as unknown as ReturnType<typeof consoleEnrollmentSessionFor>
        }
      />,
    );
    expect(
      screen.getByRole("status", {
        name: /loading enrollment session/i,
      }),
    ).toBeDefined();
  });

  it("renders ApiErrorView with retry when loader rejects (R1 pattern)", async () => {
    const error = Object.assign(new Error("loader failed"), {
      code: "LOADER_FAIL",
      status: 500,
    });
    render(
      <EnrollmentSessionMonitor loader={() => Promise.reject(error)} />,
    );
    expect(await screen.findByText(/loader failed/i)).toBeDefined();
    expect(
      screen.getByRole("button", { name: /try again|retry/i }),
    ).toBeDefined();
  });

  it("covers all 8 enrollment session scenarios with distinct snapshots", () => {
    expect(ENROLLMENT_SESSION_SCENARIOS.length).toBe(8);
    const states = new Set<EnrollmentSessionState>();
    for (const s of ENROLLMENT_SESSION_SCENARIOS) {
      const snapshot = consoleEnrollmentSessionFor(s);
      expect(snapshot.scenario).toBe(s);
      states.add(snapshot.session.state);
    }
    expect(states.size).toBe(8);
  });
});

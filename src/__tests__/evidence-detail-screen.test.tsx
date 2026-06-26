import { describe, expect, it, vi } from "vitest";
import { render, screen, within } from "@testing-library/react";

vi.mock("next/navigation", () => ({
  usePathname: () => "/evidence/EVD-77210",
}));

import { EvidenceDetailScreen } from "@/app/(shell)/evidence/_components/EvidenceDetailScreen";
import { consoleEvidenceDetailFor } from "@/app/(shell)/evidence/_components/consoleEvidenceDetailFixtures";

describe("EvidenceDetailScreen", () => {
  it("telemetry evidence: heading + meta + media + report sections render", async () => {
    render(
      <EvidenceDetailScreen
        evidenceId="EVD-77210"
        loader={consoleEvidenceDetailFor}
      />,
    );
    await screen.findByRole("heading", { level: 1, name: /EVD-77210/ });
    expect(
      screen.getByRole("link", { name: /^evidence$/i }),
    ).toBeDefined();
    // Type chip with canonical token.
    expect(screen.getAllByText(/\(telemetry\)/i).length).toBeGreaterThan(
      0,
    );
    // Media + report sections.
    expect(
      screen.getByRole("list", { name: /media refs/i }),
    ).toBeDefined();
    expect(
      screen.getByRole("list", { name: /report refs/i }),
    ).toBeDefined();
  });

  it("playback + export buttons are disabled (no fake readiness)", async () => {
    render(
      <EvidenceDetailScreen
        evidenceId="EVD-77210"
        loader={consoleEvidenceDetailFor}
      />,
    );
    await screen.findByRole("heading", { level: 1, name: /EVD-77210/ });
    const group = screen.getByRole("group", { name: /evidence actions/i });
    const playback = within(group).getByRole("button", {
      name: /playback/i,
    }) as HTMLButtonElement;
    const exp = within(group).getByRole("button", {
      name: /export/i,
    }) as HTMLButtonElement;
    expect(playback.disabled).toBe(true);
    expect(exp.disabled).toBe(true);
    expect(playback.getAttribute("title")).toMatch(/unavailable|ещё не/i);
    expect(exp.getAttribute("title")).toMatch(/unavailable|ещё не/i);
  });

  it("multi-recording evidence: both recordings + active manifestError visible", async () => {
    render(
      <EvidenceDetailScreen
        evidenceId="EVD-77211"
        loader={consoleEvidenceDetailFor}
      />,
    );
    await screen.findByRole("heading", { level: 1, name: /EVD-77211/ });
    const list = screen.getByRole("list", { name: /media refs/i });
    expect(within(list).getByText(/REC-77211-CABIN/)).toBeDefined();
    expect(within(list).getByText(/REC-77211-EXT/)).toBeDefined();
    expect(
      within(list).getByLabelText(/manifest error for REC-77211-EXT/i),
    ).toBeDefined();
  });

  it("failed evidence: media manifestError + report reportError surfaced", async () => {
    render(
      <EvidenceDetailScreen
        evidenceId="EVD-77204"
        loader={consoleEvidenceDetailFor}
      />,
    );
    await screen.findByRole("heading", { level: 1, name: /EVD-77204/ });
    expect(
      screen.getByLabelText(/manifest error for REC-77204-PHOTO/i),
    ).toBeDefined();
    expect(
      screen.getByLabelText(/report error for RPT-EXM-2026-0334/i),
    ).toBeDefined();
  });

  it("biometry-only evidence: empty media list, report still listed", async () => {
    render(
      <EvidenceDetailScreen
        evidenceId="EVD-77198"
        loader={consoleEvidenceDetailFor}
      />,
    );
    await screen.findByRole("heading", { level: 1, name: /EVD-77198/ });
    expect(
      screen.getByText(/no linked media recordings/i),
    ).toBeDefined();
    expect(
      screen.getByRole("list", { name: /report refs/i }),
    ).toBeDefined();
  });

  it("pending evidence: active recording + no report listed", async () => {
    render(
      <EvidenceDetailScreen
        evidenceId="EVD-77212"
        loader={consoleEvidenceDetailFor}
      />,
    );
    await screen.findByRole("heading", { level: 1, name: /EVD-77212/ });
    const mediaList = screen.getByRole("list", { name: /media refs/i });
    expect(within(mediaList).getByText(/REC-77212/)).toBeDefined();
    expect(
      screen.getByText(/no linked reporting documents/i),
    ).toBeDefined();
  });

  it("unknown evidence id: honest not-found note rendered (no invented refs)", async () => {
    render(
      <EvidenceDetailScreen
        evidenceId="EVD-NOT-A-REAL-ID"
        loader={consoleEvidenceDetailFor}
      />,
    );
    await screen.findByRole("heading", {
      level: 1,
      name: /EVD-NOT-A-REAL-ID/,
    });
    expect(
      screen.getByText(/not present in any fixture/i),
    ).toBeDefined();
    expect(
      screen.getByText(/no linked media recordings/i),
    ).toBeDefined();
    expect(
      screen.getByText(/no linked reporting documents/i),
    ).toBeDefined();
  });
});

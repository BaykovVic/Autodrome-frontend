import { describe, expect, it } from "vitest";
import { fireEvent, render, screen, within } from "@testing-library/react";

import { EvidenceScreen } from "@/app/(shell)/evidence/_components/EvidenceScreen";
import { consoleEvidenceFor } from "@/app/(shell)/evidence/_components/consoleEvidenceFixtures";
import type { MockScenario } from "@/api/mock/scenarios";

function renderScreen(scenario: MockScenario) {
  render(<EvidenceScreen loader={() => consoleEvidenceFor(scenario)} />);
}

describe("EvidenceScreen", () => {
  it("renders header with title, subtitle and disabled Export selected", async () => {
    renderScreen("normal");
    expect(
      await screen.findByRole("heading", { level: 1, name: /^evidence$/i }),
    ).toBeDefined();
    expect(
      await screen.findByText(/sealed references/i),
    ).toBeDefined();
    const exportBtn = (await screen.findByRole("button", {
      name: /export selected/i,
    })) as HTMLButtonElement;
    expect(exportBtn.disabled).toBe(true);
  });

  it("renders catalog rows with reference/exam/type/captured/size/status", async () => {
    renderScreen("normal");
    await screen.findAllByText("EVD-77210");
    expect(screen.getAllByText("EVD-77211").length).toBeGreaterThan(0);
    expect(screen.getAllByText(/EXM-2026-0337/).length).toBeGreaterThan(0);
    expect(screen.getAllByText(/4\.2 MB/).length).toBeGreaterThan(0);
  });

  it("opens detail with media preview, reference dl, and disabled actions", async () => {
    renderScreen("normal");
    await screen.findAllByText("EVD-77210");
    fireEvent.click(screen.getByRole("button", { name: /EVD-77211/i }));
    const detail = screen.getByRole("complementary", {
      name: /Evidence EVD-77211/i,
    });
    expect(within(detail).getByText(/Media preview/i)).toBeDefined();
    expect(
      within(detail).getByRole("img", { name: /preview unavailable offline/i }),
    ).toBeDefined();
    expect(within(detail).getByText(/^Reference$/i)).toBeDefined();
    expect(within(detail).getByText(/Source exam/i)).toBeDefined();
    expect(within(detail).getByText(/SHA-256/i)).toBeDefined();
    expect(within(detail).getByText(/5b07…d11a/)).toBeDefined();
    const verifyBtn = within(detail).getByRole("button", {
      name: /verify hash/i,
    }) as HTMLButtonElement;
    expect(verifyBtn.disabled).toBe(true);
    const exportBtn = within(detail).getByRole("button", {
      name: /^export$/i,
    }) as HTMLButtonElement;
    expect(exportBtn.disabled).toBe(true);
  });

  it("renders DegradedState banner for the service-degraded scenario", async () => {
    renderScreen("service-degraded");
    await screen.findAllByText("EVD-77210");
    expect(
      screen.getByText(/media-archive-service · evidence/i),
    ).toBeDefined();
  });

  it("renders empty state for the empty scenario", async () => {
    renderScreen("empty");
    expect(
      await screen.findByText(/No evidence in this scenario/i),
    ).toBeDefined();
  });

  it("renders Skeleton while loader is pending (R1 pattern)", () => {
    const pending = new Promise<never>(() => {});
    render(
      <EvidenceScreen
        loader={() =>
          pending as unknown as ReturnType<typeof consoleEvidenceFor>
        }
      />,
    );
    expect(
      screen.getByRole("status", { name: /loading evidence/i }),
    ).toBeDefined();
  });

  it("renders ApiErrorView with retry when loader rejects (R1 pattern)", async () => {
    const error = Object.assign(new Error("loader failed"), {
      code: "LOADER_FAIL",
      status: 500,
    });
    render(<EvidenceScreen loader={() => Promise.reject(error)} />);
    expect(
      await screen.findByText(/loader failed/i),
    ).toBeDefined();
    expect(
      screen.getByRole("button", { name: /try again|retry/i }),
    ).toBeDefined();
  });

  it("selects a row via the keyboard-accessible primary-cell button (R2 pattern)", async () => {
    renderScreen("normal");
    await screen.findAllByText("EVD-77210");
    fireEvent.click(screen.getByRole("button", { name: /EVD-77204/i }));
    expect(
      screen.getByRole("complementary", { name: /Evidence EVD-77204/i }),
    ).toBeDefined();
  });
});

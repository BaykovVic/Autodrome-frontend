import { describe, expect, it, vi, beforeEach } from "vitest";
import { fireEvent, render, screen, within } from "@testing-library/react";

import { StartEnrollmentDialog } from "@/app/(shell)/candidates/_components/StartEnrollmentDialog";
import {
  consoleEnrollmentChannelsFor,
  ENROLLMENT_SCENARIOS,
} from "@/app/(shell)/candidates/_components/consoleEnrollmentChannelsFixtures";
import type { EnrollmentScenario } from "@/app/(shell)/candidates/_components/consoleEnrollmentChannels";

beforeEach(() => {
  const proto = (
    globalThis.HTMLDialogElement as unknown as { prototype: HTMLElement }
  ).prototype;
  if (proto && !("showModal" in proto)) {
    Object.defineProperty(proto, "showModal", {
      configurable: true,
      writable: true,
      value: function showModal(this: HTMLDialogElement) {
        this.setAttribute("open", "");
      },
    });
    Object.defineProperty(proto, "close", {
      configurable: true,
      writable: true,
      value: function close(this: HTMLDialogElement) {
        this.removeAttribute("open");
      },
    });
  }
});

function renderDialog(scenario: EnrollmentScenario) {
  const onClose = vi.fn();
  render(
    <StartEnrollmentDialog
      open={true}
      onClose={onClose}
      candidateId="CND-2026-TEST"
      candidateName="Anna Petrova"
      maskedDob="**.**.2001"
      channels={consoleEnrollmentChannelsFor(scenario)}
    />,
  );
  return { onClose };
}

describe("StartEnrollmentDialog", () => {
  it("renders candidate identity in the header", () => {
    renderDialog("registrar-online");
    const dialog = screen.getByRole("dialog", {
      name: /start face enrollment/i,
    });
    expect(within(dialog).getByText(/Anna Petrova/i)).toBeDefined();
    expect(within(dialog).getByText(/CND-2026-TEST/)).toBeDefined();
    expect(within(dialog).getByText(/\*\*\.\*\*\.2001/)).toBeDefined();
  });

  it("renders both channel cards and selects registrar by default when online", () => {
    renderDialog("registrar-online");
    const dialog = screen.getByRole("dialog");
    const registrarTab = within(dialog).getByRole("tab", {
      name: /send to registrar tablet/i,
    });
    expect(registrarTab.getAttribute("aria-selected")).toBe("true");
    expect(
      within(dialog).getByRole("tab", { name: /local web camera/i }),
    ).toBeDefined();
    // Send to registrar action visible.
    expect(
      within(dialog).getByRole("button", { name: /send to registrar/i }),
    ).toBeDefined();
  });

  it("switches to local channel and surfaces local camera detail card", () => {
    renderDialog("registrar-online");
    const localTab = screen.getByRole("tab", {
      name: /local web camera/i,
    });
    fireEvent.click(localTab);
    expect(localTab.getAttribute("aria-selected")).toBe("true");
    expect(screen.getByText(/Logitech BRIO/)).toBeDefined();
    expect(screen.getByText(/Camera detected/i)).toBeDefined();
    expect(
      screen.getByRole("button", { name: /use local camera/i }),
    ).toBeDefined();
  });

  it("disables Send to registrar when registrar is offline (with visible reason in title)", () => {
    renderDialog("registrar-offline");
    // Default channel falls back to `local` when registrar is offline;
    // the operator must still be able to inspect the offline registrar.
    fireEvent.click(
      screen.getByRole("tab", { name: /send to registrar tablet/i }),
    );
    const send = screen.getByRole("button", {
      name: /send to registrar/i,
    }) as HTMLButtonElement;
    expect(send.disabled).toBe(true);
    expect(send.getAttribute("title") ?? "").toMatch(
      /Registrar tablet is offline/i,
    );
    expect(screen.getByText(/^Offline$/i)).toBeDefined();
  });

  it("disables Use local camera when no camera detected (with visible reason in title)", () => {
    renderDialog("local-camera-unavailable");
    fireEvent.click(
      screen.getByRole("tab", { name: /local web camera/i }),
    );
    const send = screen.getByRole("button", {
      name: /use local camera/i,
    }) as HTMLButtonElement;
    expect(send.disabled).toBe(true);
    expect(send.getAttribute("title") ?? "").toMatch(
      /No local camera detected/i,
    );
    expect(screen.getByText(/No camera detected/i)).toBeDefined();
  });

  it("disables Retry and shows the reason note when an attempt is active", () => {
    renderDialog("attempt-active");
    const retry = screen.getByRole("button", {
      name: /^retry$/i,
    }) as HTMLButtonElement;
    expect(retry.disabled).toBe(true);
    expect(retry.getAttribute("title") ?? "").toMatch(
      /until the current enrollment attempt completes/i,
    );
    expect(
      screen.getByRole("note", {
        // The note text matches the same reason copy.
      }),
    ).toBeDefined();
  });

  it("Cancel calls onClose", () => {
    const { onClose } = renderDialog("registrar-online");
    fireEvent.click(screen.getByRole("button", { name: /^cancel$/i }));
    expect(onClose).toHaveBeenCalled();
  });

  it("clicking Send to registrar transitions to the command-queued mock state with visible status", () => {
    renderDialog("registrar-online");
    fireEvent.click(
      screen.getByRole("button", { name: /send to registrar/i }),
    );
    expect(
      screen.queryByRole("button", { name: /send to registrar/i }),
    ).toBeNull();
    expect(
      screen.queryByRole("tab", { name: /send to registrar tablet/i }),
    ).toBeNull();
    expect(
      screen.getByText(/Command queued for the registrar tablet/i),
    ).toBeDefined();
    expect(screen.getByText(/REG-TAB-02/)).toBeDefined();
    expect(
      screen.getByText(/No real Android transport is wired in this baseline/i),
    ).toBeDefined();
    expect(
      screen.getByRole("button", { name: /^close$/i }),
    ).toBeDefined();
  });

  it("clicking Use local camera transitions to the local-prepared mock state with visible status", () => {
    renderDialog("local-camera-available");
    fireEvent.click(screen.getByRole("tab", { name: /local web camera/i }));
    fireEvent.click(
      screen.getByRole("button", { name: /use local camera/i }),
    );
    expect(
      screen.queryByRole("button", { name: /use local camera/i }),
    ).toBeNull();
    expect(
      screen.getByText(/Local capture prepared on this PC/i),
    ).toBeDefined();
    expect(screen.getByText(/Logitech BRIO/)).toBeDefined();
    expect(
      screen.getByText(/No real camera capture runs in this baseline/i),
    ).toBeDefined();
    expect(
      screen.getByRole("button", { name: /^close$/i }),
    ).toBeDefined();
  });

  it("the Close action in the committed phase calls onClose", () => {
    const { onClose } = renderDialog("registrar-online");
    fireEvent.click(
      screen.getByRole("button", { name: /send to registrar/i }),
    );
    fireEvent.click(screen.getByRole("button", { name: /^close$/i }));
    expect(onClose).toHaveBeenCalled();
  });

  it("covers all five enrollment scenarios with distinct snapshots", () => {
    expect(ENROLLMENT_SCENARIOS.length).toBe(5);
    const scenarios = new Set<EnrollmentScenario>();
    for (const s of ENROLLMENT_SCENARIOS) {
      const snapshot = consoleEnrollmentChannelsFor(s);
      expect(snapshot.scenario).toBe(s);
      scenarios.add(snapshot.scenario);
    }
    expect(scenarios.size).toBe(5);
  });
});

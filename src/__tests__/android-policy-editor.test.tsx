import { describe, expect, it, vi } from "vitest";
import { fireEvent, render, screen, within } from "@testing-library/react";

vi.mock("next/navigation", () => ({
  usePathname: () => "/devices",
}));

import { AndroidDevicePolicyEditor } from "@/app/(shell)/devices/_components/AndroidDevicePolicyEditor";
import type {
  ConsoleAndroidDevice,
  ConsoleAndroidDeviceCapabilityPolicy,
} from "@/app/(shell)/devices/_components/consoleAndroidDevicesSnapshot";
import { AndroidDevicesScreen } from "@/app/(shell)/devices/_components/AndroidDevicesScreen";
import { consoleAndroidDevicesFor } from "@/app/(shell)/devices/_components/consoleAndroidDevicesFixtures";

// Stub showModal/close because happy-dom's <dialog> implementation
// does not include them by default. Mirrors the
// candidate-create-screen.test.tsx setup.
const dialogProto = (
  globalThis.HTMLDialogElement as unknown as { prototype: HTMLElement }
).prototype;
if (dialogProto && !("showModal" in dialogProto)) {
  Object.defineProperty(dialogProto, "showModal", {
    configurable: true,
    writable: true,
    value: function showModal(this: HTMLDialogElement) {
      (this as unknown as { open: boolean }).open = true;
    },
  });
}
if (dialogProto && !("close" in dialogProto)) {
  Object.defineProperty(dialogProto, "close", {
    configurable: true,
    writable: true,
    value: function close(this: HTMLDialogElement) {
      (this as unknown as { open: boolean }).open = false;
      this.dispatchEvent(new Event("close"));
    },
  });
}

const NOW = "2026-06-24T00:00:00Z";

function makeDevice(
  over: Partial<ConsoleAndroidDevice> = {},
): ConsoleAndroidDevice {
  return {
    id: "AD-TEST",
    status: "active",
    statusLabel: "active",
    role: "registrar",
    roleLabel: "registrar",
    binding: {
      type: "receptionPoint",
      anchorId: "RPT-A",
      anchorLabel: "Reception A",
    },
    policy: {
      policyVersion: 2,
      disabledCapabilities: ["diagnostics"],
      policyReason: "initial",
      updatedAt: "2026-06-22T08:00:00Z",
    },
    platform: {
      manufacturer: "Samsung",
      model: "Tab S9",
      osVersion: "Android 14",
      appVersion: "0.9.0",
    },
    registeredAt: "2026-06-15T09:00:00Z",
    assignedAt: "2026-06-15T11:00:00Z",
    ...over,
  };
}

describe("AndroidDevicePolicyEditor (component)", () => {
  it("renders header, device meta, presets, capability list, reason field", () => {
    const onSave = vi.fn();
    const onClose = vi.fn();
    render(
      <AndroidDevicePolicyEditor
        open
        device={makeDevice()}
        now={NOW}
        onSave={onSave}
        onClose={onClose}
      />,
    );
    const dialog = screen.getByRole("dialog", {
      name: /Edit capability policy · AD-TEST/i,
    });
    expect(
      within(dialog).getByRole("heading", {
        level: 2,
        name: /edit capability policy/i,
      }),
    ).toBeDefined();
    // Current policyVersion is visible.
    expect(within(dialog).getByText("v2")).toBeDefined();
    // Presets are present.
    expect(
      within(dialog).getByRole("button", {
        name: /apply registrar preset/i,
      }),
    ).toBeDefined();
    expect(
      within(dialog).getByRole("button", {
        name: /apply vehicleverifier preset/i,
      }),
    ).toBeDefined();
    expect(
      within(dialog).getByRole("button", { name: /clear all/i }),
    ).toBeDefined();
    // All 6 canonical capability checkboxes appear with mono code chips.
    expect(within(dialog).getByText("enrollmentCapture")).toBeDefined();
    expect(within(dialog).getByText("verificationCapture")).toBeDefined();
    expect(within(dialog).getByText("passiveFaceCheck")).toBeDefined();
    expect(within(dialog).getByText("devicePairing")).toBeDefined();
    expect(within(dialog).getByText("diagnostics")).toBeDefined();
    expect(within(dialog).getByText("settings")).toBeDefined();
    // policyReason textarea seeded with current value.
    const reason = within(dialog).getByLabelText(
      /policyreason/i,
    ) as HTMLTextAreaElement;
    expect(reason.value).toBe("initial");
  });

  it("toggling a capability checkbox updates the draft (visible in confirm dialog)", () => {
    const onSave = vi.fn();
    const onClose = vi.fn();
    render(
      <AndroidDevicePolicyEditor
        open
        device={makeDevice({
          policy: { policyVersion: 1, disabledCapabilities: [] },
        })}
        now={NOW}
        onSave={onSave}
        onClose={onClose}
      />,
    );
    // Enable a non-critical capability — no confirm needed.
    fireEvent.click(screen.getByLabelText(/diagnostics/i));
    fireEvent.click(screen.getByRole("button", { name: /^save$/i }));
    expect(onSave).toHaveBeenCalledTimes(1);
    expect(onSave.mock.calls[0][0]).toBe("AD-TEST");
    const nextPolicy = onSave.mock
      .calls[0][1] as ConsoleAndroidDeviceCapabilityPolicy;
    expect(nextPolicy.disabledCapabilities).toEqual(["diagnostics"]);
    expect(nextPolicy.policyVersion).toBe(2);
    expect(nextPolicy.updatedAt).toBe(NOW);
  });

  it("applying a preset replaces the disabled set (registrar preset)", () => {
    const onSave = vi.fn();
    const onClose = vi.fn();
    render(
      <AndroidDevicePolicyEditor
        open
        device={makeDevice({
          policy: { policyVersion: 5, disabledCapabilities: [] },
        })}
        now={NOW}
        onSave={onSave}
        onClose={onClose}
      />,
    );
    fireEvent.click(
      screen.getByRole("button", { name: /apply registrar preset/i }),
    );
    // Registrar preset disables critical capabilities → confirm
    // dialog appears.
    fireEvent.click(screen.getByRole("button", { name: /^save$/i }));
    expect(
      screen.getByRole("dialog", { name: /confirm policy change/i }),
    ).toBeDefined();
    fireEvent.click(
      screen.getByRole("button", { name: /confirm.*save/i }),
    );
    expect(onSave).toHaveBeenCalledTimes(1);
    const nextPolicy = onSave.mock
      .calls[0][1] as ConsoleAndroidDeviceCapabilityPolicy;
    expect(nextPolicy.disabledCapabilities).toEqual([
      "verificationCapture",
      "passiveFaceCheck",
      "diagnostics",
      "settings",
    ]);
    expect(nextPolicy.policyVersion).toBe(6);
  });

  it("edits policyReason and trims it on save", () => {
    const onSave = vi.fn();
    const onClose = vi.fn();
    render(
      <AndroidDevicePolicyEditor
        open
        device={makeDevice({
          policy: { policyVersion: 1, disabledCapabilities: [] },
        })}
        now={NOW}
        onSave={onSave}
        onClose={onClose}
      />,
    );
    const reason = screen.getByLabelText(
      /policyreason/i,
    ) as HTMLTextAreaElement;
    fireEvent.change(reason, {
      target: { value: "   pilot rollout   " },
    });
    fireEvent.click(screen.getByRole("button", { name: /^save$/i }));
    const nextPolicy = onSave.mock
      .calls[0][1] as ConsoleAndroidDeviceCapabilityPolicy;
    expect(nextPolicy.policyReason).toBe("pilot rollout");
  });

  it("Cancel button closes the editor without calling onSave", () => {
    const onSave = vi.fn();
    const onClose = vi.fn();
    render(
      <AndroidDevicePolicyEditor
        open
        device={makeDevice()}
        now={NOW}
        onSave={onSave}
        onClose={onClose}
      />,
    );
    fireEvent.click(screen.getByLabelText(/diagnostics/i));
    fireEvent.click(screen.getByRole("button", { name: /^cancel$/i }));
    expect(onSave).not.toHaveBeenCalled();
    expect(onClose).toHaveBeenCalled();
  });

  it("safe-confirm: critical change shows confirm dialog and 'Keep editing' returns to editor without saving", () => {
    const onSave = vi.fn();
    const onClose = vi.fn();
    render(
      <AndroidDevicePolicyEditor
        open
        device={makeDevice({
          policy: { policyVersion: 1, disabledCapabilities: [] },
        })}
        now={NOW}
        onSave={onSave}
        onClose={onClose}
      />,
    );
    // Toggle a critical capability.
    fireEvent.click(screen.getByLabelText(/runtime settings/i));
    fireEvent.click(screen.getByRole("button", { name: /^save$/i }));
    const confirmDialog = screen.getByRole("dialog", {
      name: /confirm policy change/i,
    });
    expect(confirmDialog).toBeDefined();
    fireEvent.click(
      within(confirmDialog).getByRole("button", { name: /keep editing/i }),
    );
    expect(onSave).not.toHaveBeenCalled();
  });

  it("safe-confirm fires for disable-all (covers all 6 canonical capabilities)", () => {
    const onSave = vi.fn();
    const onClose = vi.fn();
    render(
      <AndroidDevicePolicyEditor
        open
        device={makeDevice({
          policy: { policyVersion: 1, disabledCapabilities: [] },
        })}
        now={NOW}
        onSave={onSave}
        onClose={onClose}
      />,
    );
    // Disable every canonical capability via individual toggles.
    fireEvent.click(screen.getByLabelText(/enrollment capture/i));
    fireEvent.click(screen.getByLabelText(/verification capture/i));
    fireEvent.click(screen.getByLabelText(/passive face check/i));
    fireEvent.click(screen.getByLabelText(/device pairing/i));
    fireEvent.click(screen.getByLabelText(/diagnostics/i));
    fireEvent.click(screen.getByLabelText(/runtime settings/i));
    fireEvent.click(screen.getByRole("button", { name: /^save$/i }));
    expect(
      screen.getByRole("dialog", { name: /confirm policy change/i }),
    ).toBeDefined();
  });

  it("renders empty draft for pending device without policy", () => {
    render(
      <AndroidDevicePolicyEditor
        open
        device={makeDevice({
          status: "pending",
          statusLabel: "pending",
          role: undefined,
          roleLabel: undefined,
          policy: undefined,
        })}
        now={NOW}
        onSave={vi.fn()}
        onClose={vi.fn()}
      />,
    );
    expect(screen.getByText("v0")).toBeDefined();
    const reason = screen.getByLabelText(
      /policyreason/i,
    ) as HTMLTextAreaElement;
    expect(reason.value).toBe("");
  });

  it("no Android Compose/View class names appear in the rendered DOM", () => {
    render(
      <AndroidDevicePolicyEditor
        open
        device={makeDevice()}
        now={NOW}
        onSave={vi.fn()}
        onClose={vi.fn()}
      />,
    );
    const dialog = screen.getByRole("dialog", {
      name: /Edit capability policy/i,
    });
    const text = dialog.textContent ?? "";
    for (const banned of [
      "Activity",
      "Fragment",
      "Composable",
      "ComposeView",
      ".kt",
    ]) {
      expect(text).not.toContain(banned);
    }
  });
});

describe("AndroidDevicesScreen integration with policy editor", () => {
  it("Edit policy button is enabled for active devices and opens the editor", async () => {
    render(
      <AndroidDevicesScreen
        loader={() => consoleAndroidDevicesFor("normal")}
        policyEditorNow={NOW}
      />,
    );
    // Default selection is the first device (pending) — open active
    // device by clicking AD-3A11-REG row first.
    fireEvent.click(
      await screen.findByRole("button", { name: /AD-3A11-REG/ }),
    );
    const detail = screen.getByRole("complementary", {
      name: /Device AD-3A11-REG/i,
    });
    const editPolicy = within(detail).getByRole("button", {
      name: /edit policy/i,
    }) as HTMLButtonElement;
    expect(editPolicy.disabled).toBe(false);
    fireEvent.click(editPolicy);
    expect(
      screen.getByRole("dialog", {
        name: /Edit capability policy · AD-3A11-REG/i,
      }),
    ).toBeDefined();
  });

  it("saving a non-critical change bumps the policyVersion shown in the detail aside", async () => {
    render(
      <AndroidDevicesScreen
        loader={() => consoleAndroidDevicesFor("normal")}
        policyEditorNow={NOW}
      />,
    );
    // Open editor for AD-5C82-REG (policyVersion = 2 in fixture).
    fireEvent.click(
      await screen.findByRole("button", { name: /AD-5C82-REG/ }),
    );
    const detail = screen.getByRole("complementary", {
      name: /Device AD-5C82-REG/i,
    });
    expect(within(detail).getByText("v2")).toBeDefined();
    fireEvent.click(
      within(detail).getByRole("button", { name: /edit policy/i }),
    );
    // Enable only the non-critical capability (diagnostics) — no confirm.
    fireEvent.click(screen.getByLabelText(/diagnostics/i));
    fireEvent.click(screen.getByRole("button", { name: /^save$/i }));
    // Updated detail aside reflects bumped policyVersion v3.
    const after = screen.getByRole("complementary", {
      name: /Device AD-5C82-REG/i,
    });
    expect(within(after).getByText("v3")).toBeDefined();
    expect(within(after).getByText("diagnostics")).toBeDefined();
  });

  it("Edit policy stays disabled for pending and retired devices", async () => {
    render(
      <AndroidDevicesScreen
        loader={() => consoleAndroidDevicesFor("normal")}
        policyEditorNow={NOW}
      />,
    );
    // Pending device (default selection).
    await screen.findByRole("button", { name: /AD-7F02-PEND/ });
    const pendingDetail = screen.getByRole("complementary", {
      name: /Device AD-7F02-PEND/i,
    });
    const pendingBtn = within(pendingDetail).getByRole("button", {
      name: /edit policy/i,
    }) as HTMLButtonElement;
    expect(pendingBtn.disabled).toBe(true);
    expect(pendingBtn.getAttribute("title")).toMatch(/pending → active/i);

    // Retired device.
    fireEvent.click(screen.getByRole("button", { name: /AD-2E55-RET/ }));
    const retiredDetail = screen.getByRole("complementary", {
      name: /Device AD-2E55-RET/i,
    });
    const retiredBtn = within(retiredDetail).getByRole("button", {
      name: /edit policy/i,
    }) as HTMLButtonElement;
    expect(retiredBtn.disabled).toBe(true);
    expect(retiredBtn.getAttribute("title")).toMatch(/retired/i);
  });
});

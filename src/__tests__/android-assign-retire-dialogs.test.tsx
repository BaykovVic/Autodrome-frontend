import { describe, expect, it, vi } from "vitest";
import { fireEvent, render, screen, within } from "@testing-library/react";

vi.mock("next/navigation", () => ({
  usePathname: () => "/devices",
}));

import { AndroidDeviceAssignDialog } from "@/app/(shell)/devices/_components/AndroidDeviceAssignDialog";
import { AndroidDeviceRetireDialog } from "@/app/(shell)/devices/_components/AndroidDeviceRetireDialog";
import { AndroidDevicesScreen } from "@/app/(shell)/devices/_components/AndroidDevicesScreen";
import { consoleAndroidDevicesFor } from "@/app/(shell)/devices/_components/consoleAndroidDevicesFixtures";
import type { ConsoleAndroidDevice } from "@/app/(shell)/devices/_components/consoleAndroidDevicesSnapshot";

// happy-dom <dialog> stub (showModal / close + dispatch close event).
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

const NOW = "2026-06-25T00:00:00Z";

function makePendingDevice(
  over: Partial<ConsoleAndroidDevice> = {},
): ConsoleAndroidDevice {
  return {
    id: "AD-TEST-PEND",
    status: "pending",
    statusLabel: "pending",
    platform: {
      manufacturer: "Samsung",
      model: "Tab S9",
      osVersion: "Android 14",
      appVersion: "0.9.1",
    },
    registeredAt: "2026-06-20T08:00:00Z",
    ...over,
  };
}

function makeActiveDevice(
  over: Partial<ConsoleAndroidDevice> = {},
): ConsoleAndroidDevice {
  return {
    id: "AD-TEST-ACTIVE",
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
      policyVersion: 1,
      disabledCapabilities: [],
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

describe("AndroidDeviceAssignDialog", () => {
  it("renders role + binding + anchor + notes fields with canonical chips", () => {
    render(
      <AndroidDeviceAssignDialog
        open
        device={makePendingDevice()}
        onSubmit={vi.fn()}
        onClose={vi.fn()}
      />,
    );
    const dialog = screen.getByRole("dialog", {
      name: /Assign Android device · AD-TEST-PEND/i,
    });
    expect(within(dialog).getByLabelText(/^role$/i)).toBeDefined();
    expect(within(dialog).getByLabelText(/binding type/i)).toBeDefined();
    expect(within(dialog).getByLabelText(/anchor id/i)).toBeDefined();
    expect(within(dialog).getByLabelText(/operator audit notes/i)).toBeDefined();
    // Save disabled visually allowed until submit attempt; we
    // verify validation on click instead of disabled state.
    expect(
      within(dialog).getByRole("button", { name: /save assignment/i }),
    ).toBeDefined();
  });

  it("rejects invalid draft with validation errors on save attempt", () => {
    const onSubmit = vi.fn();
    render(
      <AndroidDeviceAssignDialog
        open
        device={makePendingDevice()}
        onSubmit={onSubmit}
        onClose={vi.fn()}
      />,
    );
    fireEvent.click(
      screen.getByRole("button", { name: /save assignment/i }),
    );
    expect(onSubmit).not.toHaveBeenCalled();
    // Validation errors surface after submit attempt.
    expect(screen.getByText(/role is required/i)).toBeDefined();
    expect(screen.getByText(/binding type is required/i)).toBeDefined();
    expect(screen.getByText(/anchor id is required/i)).toBeDefined();
  });

  it("filters binding options by role (registrar)", () => {
    render(
      <AndroidDeviceAssignDialog
        open
        device={makePendingDevice()}
        onSubmit={vi.fn()}
        onClose={vi.fn()}
      />,
    );
    const roleSelect = screen.getByLabelText(/^role$/i) as HTMLSelectElement;
    fireEvent.change(roleSelect, { target: { value: "registrar" } });
    const bindingSelect = screen.getByLabelText(
      /binding type/i,
    ) as HTMLSelectElement;
    // Only two options visible (+ placeholder); each canonical token
    // appears in option text.
    expect(bindingSelect.textContent).toContain("receptionPoint");
    expect(bindingSelect.textContent).toContain("workstation");
    expect(bindingSelect.textContent).not.toContain("vehicle (");
  });

  it("filters binding options by role (vehicleVerifier)", () => {
    render(
      <AndroidDeviceAssignDialog
        open
        device={makePendingDevice()}
        onSubmit={vi.fn()}
        onClose={vi.fn()}
      />,
    );
    const roleSelect = screen.getByLabelText(/^role$/i) as HTMLSelectElement;
    fireEvent.change(roleSelect, {
      target: { value: "vehicleVerifier" },
    });
    const bindingSelect = screen.getByLabelText(
      /binding type/i,
    ) as HTMLSelectElement;
    expect(bindingSelect.textContent).toContain("vehicle");
    expect(bindingSelect.textContent).not.toContain("receptionPoint (");
    expect(bindingSelect.textContent).not.toContain("workstation (");
  });

  it("clears bindingType when switching role makes the current binding incompatible", () => {
    render(
      <AndroidDeviceAssignDialog
        open
        device={makeActiveDevice({
          role: "registrar",
          binding: {
            type: "receptionPoint",
            anchorId: "RPT-A",
            anchorLabel: "Reception A",
          },
        })}
        onSubmit={vi.fn()}
        onClose={vi.fn()}
      />,
    );
    const bindingSelect = screen.getByLabelText(
      /binding type/i,
    ) as HTMLSelectElement;
    expect(bindingSelect.value).toBe("receptionPoint");
    const roleSelect = screen.getByLabelText(/^role$/i) as HTMLSelectElement;
    fireEvent.change(roleSelect, {
      target: { value: "vehicleVerifier" },
    });
    expect(bindingSelect.value).toBe("");
  });

  it("dispatches canonical assignment body on valid save", () => {
    const onSubmit = vi.fn();
    const onClose = vi.fn();
    render(
      <AndroidDeviceAssignDialog
        open
        device={makePendingDevice()}
        onSubmit={onSubmit}
        onClose={onClose}
      />,
    );
    fireEvent.change(screen.getByLabelText(/^role$/i), {
      target: { value: "registrar" },
    });
    fireEvent.change(screen.getByLabelText(/binding type/i), {
      target: { value: "workstation" },
    });
    fireEvent.change(screen.getByLabelText(/anchor id/i), {
      target: { value: "  WS-1  " },
    });
    fireEvent.change(screen.getByLabelText(/operator audit notes/i), {
      target: { value: "Pilot" },
    });
    fireEvent.click(
      screen.getByRole("button", { name: /save assignment/i }),
    );
    expect(onSubmit).toHaveBeenCalledTimes(1);
    expect(onSubmit.mock.calls[0][0]).toBe("AD-TEST-PEND");
    expect(onSubmit.mock.calls[0][1]).toEqual({
      role: "registrar",
      binding: { type: "workstation", anchorId: "WS-1" },
      notes: "Pilot",
    });
    expect(onClose).toHaveBeenCalled();
  });

  it("Cancel closes the dialog without calling onSubmit", () => {
    const onSubmit = vi.fn();
    const onClose = vi.fn();
    render(
      <AndroidDeviceAssignDialog
        open
        device={makePendingDevice()}
        onSubmit={onSubmit}
        onClose={onClose}
      />,
    );
    fireEvent.click(screen.getByRole("button", { name: /^cancel$/i }));
    expect(onSubmit).not.toHaveBeenCalled();
    expect(onClose).toHaveBeenCalled();
  });
});

describe("AndroidDeviceRetireDialog", () => {
  it("renders reason textarea with canonical hint", () => {
    render(
      <AndroidDeviceRetireDialog
        open
        device={makeActiveDevice()}
        onSubmit={vi.fn()}
        onClose={vi.fn()}
      />,
    );
    const dialog = screen.getByRole("dialog", {
      name: /Retire Android device · AD-TEST-ACTIVE/i,
    });
    expect(within(dialog).getByLabelText(/audit reason/i)).toBeDefined();
    expect(within(dialog).getByText(/terminal lifecycle/i)).toBeDefined();
  });

  it("safe-confirm flow: Retire device → confirm view → Confirm & retire dispatches", () => {
    const onSubmit = vi.fn();
    const onClose = vi.fn();
    render(
      <AndroidDeviceRetireDialog
        open
        device={makeActiveDevice()}
        onSubmit={onSubmit}
        onClose={onClose}
      />,
    );
    fireEvent.change(screen.getByLabelText(/audit reason/i), {
      target: { value: "  decommissioned  " },
    });
    fireEvent.click(screen.getByRole("button", { name: /retire device/i }));
    // Confirm view appears.
    expect(
      screen.getByRole("dialog", { name: /confirm retire/i }),
    ).toBeDefined();
    expect(screen.getByText(/decommissioned/)).toBeDefined();
    fireEvent.click(
      screen.getByRole("button", { name: /confirm.*retire/i }),
    );
    expect(onSubmit).toHaveBeenCalledTimes(1);
    expect(onSubmit.mock.calls[0]).toEqual([
      "AD-TEST-ACTIVE",
      { reason: "decommissioned" },
    ]);
    expect(onClose).toHaveBeenCalled();
  });

  it("Keep editing returns to the reason form without saving", () => {
    const onSubmit = vi.fn();
    render(
      <AndroidDeviceRetireDialog
        open
        device={makeActiveDevice()}
        onSubmit={onSubmit}
        onClose={vi.fn()}
      />,
    );
    fireEvent.click(screen.getByRole("button", { name: /retire device/i }));
    expect(
      screen.getByRole("dialog", { name: /confirm retire/i }),
    ).toBeDefined();
    fireEvent.click(screen.getByRole("button", { name: /keep editing/i }));
    expect(onSubmit).not.toHaveBeenCalled();
    expect(
      screen.getByRole("dialog", {
        name: /Retire Android device/i,
      }),
    ).toBeDefined();
  });

  it("dispatches empty body when reason is empty (canonical absent semantics)", () => {
    const onSubmit = vi.fn();
    render(
      <AndroidDeviceRetireDialog
        open
        device={makeActiveDevice()}
        onSubmit={onSubmit}
        onClose={vi.fn()}
      />,
    );
    fireEvent.click(screen.getByRole("button", { name: /retire device/i }));
    fireEvent.click(
      screen.getByRole("button", { name: /confirm.*retire/i }),
    );
    expect(onSubmit.mock.calls[0][1]).toEqual({});
  });

  it("Cancel from form view closes without firing onSubmit", () => {
    const onSubmit = vi.fn();
    const onClose = vi.fn();
    render(
      <AndroidDeviceRetireDialog
        open
        device={makeActiveDevice()}
        onSubmit={onSubmit}
        onClose={onClose}
      />,
    );
    fireEvent.click(screen.getByRole("button", { name: /^cancel$/i }));
    expect(onSubmit).not.toHaveBeenCalled();
    expect(onClose).toHaveBeenCalled();
  });
});

describe("AndroidDevicesScreen integration: assign + retire flows mutate snapshot", () => {
  it("Assign on pending device transitions to active + binding + default empty policy", async () => {
    render(
      <AndroidDevicesScreen
        loader={() => consoleAndroidDevicesFor("normal")}
        policyEditorNow={NOW}
      />,
    );
    await screen.findByRole("button", { name: /AD-7F02-PEND/ });
    // Open Assign dialog from pending device.
    const detail = screen.getByRole("complementary", {
      name: /Device AD-7F02-PEND/i,
    });
    fireEvent.click(
      within(detail).getByRole("button", { name: /assign/i }),
    );
    const dialog = screen.getByRole("dialog", {
      name: /Assign Android device · AD-7F02-PEND/i,
    });
    // Fill the form.
    fireEvent.change(within(dialog).getByLabelText(/^role$/i), {
      target: { value: "registrar" },
    });
    fireEvent.change(within(dialog).getByLabelText(/binding type/i), {
      target: { value: "receptionPoint" },
    });
    fireEvent.change(within(dialog).getByLabelText(/anchor id/i), {
      target: { value: "RPT-NEW" },
    });
    fireEvent.click(
      within(dialog).getByRole("button", { name: /save assignment/i }),
    );

    // Detail aside now shows active status.
    const after = screen.getByRole("complementary", {
      name: /Device AD-7F02-PEND/i,
    });
    expect(within(after).getAllByText("active")[0]).toBeDefined();
    expect(within(after).getAllByText(/RPT-NEW/).length).toBeGreaterThanOrEqual(1);
    expect(within(after).getByText(/v1/)).toBeDefined();
  });

  it("Retire on active device transitions to retired + locks affordances", async () => {
    render(
      <AndroidDevicesScreen
        loader={() => consoleAndroidDevicesFor("normal")}
        policyEditorNow={NOW}
      />,
    );
    await screen.findByRole("button", { name: /AD-7F02-PEND/ });
    fireEvent.click(screen.getByRole("button", { name: /AD-3A11-REG/ }));
    const detail = screen.getByRole("complementary", {
      name: /Device AD-3A11-REG/i,
    });
    fireEvent.click(
      within(detail).getByRole("button", { name: /retire/i }),
    );
    const dialog = screen.getByRole("dialog", {
      name: /Retire Android device/i,
    });
    fireEvent.change(within(dialog).getByLabelText(/audit reason/i), {
      target: { value: "Decommissioned" },
    });
    fireEvent.click(
      within(dialog).getByRole("button", { name: /retire device/i }),
    );
    fireEvent.click(
      screen.getByRole("button", { name: /confirm.*retire/i }),
    );

    const after = screen.getByRole("complementary", {
      name: /Device AD-3A11-REG/i,
    });
    // Status now retired (badge + filter would show retired).
    expect(within(after).getAllByText("retired")[0]).toBeDefined();
    // Edit policy + Retire affordances locked down.
    const editPolicy = within(after).getByRole("button", {
      name: /edit policy/i,
    }) as HTMLButtonElement;
    const retire = within(after).getByRole("button", {
      name: /retire/i,
    }) as HTMLButtonElement;
    expect(editPolicy.disabled).toBe(true);
    expect(retire.disabled).toBe(true);
    expect(retire.getAttribute("title")).toMatch(/already retired/i);
  });
});

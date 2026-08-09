import { beforeEach, describe, expect, it, vi } from "vitest";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";

vi.mock("next/navigation", () => ({
  usePathname: () => "/devices",
}));

// Runtime mode is swapped per test so the command paths (mock-local
// mutation vs live POST) can both be exercised in one suite.
const runtime = { mode: "mock" as "mock" | "live" };
vi.mock("@/api/runtime-config", async (importOriginal) => {
  const actual =
    await importOriginal<typeof import("@/api/runtime-config")>();
  return { ...actual, resolveRuntimeMode: () => runtime.mode };
});

const adapterRef = { current: null as unknown };
vi.mock("@/api/get-api-adapter", async (importOriginal) => {
  const actual =
    await importOriginal<typeof import("@/api/get-api-adapter")>();
  return { ...actual, getApiAdapter: () => adapterRef.current };
});

import type { AutodromeApi } from "@/api/adapter";
import { ApiError } from "@/api/errors";
import type { ConsoleSessionResult } from "@/app/(shell)/_session/consoleSession";
import { SessionProvider } from "@/app/(shell)/_session/SessionProvider";
import { AndroidDeviceAssignDialog } from "@/app/(shell)/devices/_components/AndroidDeviceAssignDialog";
import { AndroidDevicesScreen } from "@/app/(shell)/devices/_components/AndroidDevicesScreen";
import type {
  ConsoleAndroidDevice,
  ConsoleAndroidDevicesSnapshot,
} from "@/app/(shell)/devices/_components/consoleAndroidDevicesSnapshot";
import type { VehicleAnchorOption } from "@/app/(shell)/devices/_components/vehicleAnchorOptions";

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

const DEVICE_ID = "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa";
const VEHICLE_A = "11111111-1111-4111-8111-111111111111";
const VEHICLE_B = "22222222-2222-4222-8222-222222222222";
const RECEPTION_UUID = "33333333-3333-4333-8333-333333333333";

const VEHICLE_OPTIONS: VehicleAnchorOption[] = [
  {
    vehicleId: VEHICLE_A,
    plateNumber: "А 014 ТУ 199",
    model: "Lada Vesta 2024",
    statusLabel: "active",
    bindable: true,
  },
  {
    vehicleId: VEHICLE_B,
    plateNumber: "В 220 ТО 199",
    model: "Lada Granta 2023",
    statusLabel: "decommissioned",
    bindable: false,
  },
];

function activeDevice(
  over: Partial<ConsoleAndroidDevice> = {},
): ConsoleAndroidDevice {
  return {
    id: DEVICE_ID,
    status: "active",
    statusLabel: "active",
    role: "registrar",
    roleLabel: "registrar",
    binding: {
      type: "receptionPoint",
      anchorId: RECEPTION_UUID,
      anchorLabel: RECEPTION_UUID,
    },
    policy: { policyVersion: 2, disabledCapabilities: [] },
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

function snapshot(
  device: ConsoleAndroidDevice = activeDevice(),
): ConsoleAndroidDevicesSnapshot {
  return {
    totals: { devices: 1, pending: 0, active: 1, retired: 0 },
    devices: [device],
  };
}

function session(permissions: string[]): ConsoleSessionResult {
  return {
    status: "authenticated",
    actor: {
      actorId: "op-1",
      actorType: "user",
      label: "Operator",
      roles: ["admin"],
      permissions,
    },
  };
}

function androidApi(POST: unknown): AutodromeApi {
  return { androidDevice: { POST } } as unknown as AutodromeApi;
}

function apiError(status: number, code: string): ApiError {
  return new ApiError({
    status,
    code,
    message: code,
    url: "/api/android-device/v1/admin/devices/x/assign",
  });
}

/** Backend-stamped response — deliberately different from the request. */
function assignedDeviceDto() {
  return {
    deviceId: DEVICE_ID,
    status: "active",
    role: "vehicleVerifier",
    binding: { type: "vehicle", anchorId: VEHICLE_A },
    policy: { policyVersion: 9, disabledCapabilities: [] },
    platform: {
      manufacturer: "Samsung",
      model: "Tab S9",
      osVersion: "Android 14",
      appVersion: "0.9.1",
    },
    registeredAt: "2026-06-20T08:00:00Z",
    assignedAt: "2026-08-09T10:00:00Z",
  };
}

function renderScreen(options: {
  permissions?: string[];
  loader?: () => ConsoleAndroidDevicesSnapshot;
  vehicleOptionsLoader?: () => VehicleAnchorOption[];
}) {
  const loader = options.loader ?? (() => snapshot());
  const vehicleOptionsLoader =
    options.vehicleOptionsLoader ?? (() => VEHICLE_OPTIONS);
  return render(
    <SessionProvider
      loader={() => session(options.permissions ?? ["device.manage"])}
    >
      <AndroidDevicesScreen
        loader={loader}
        vehicleOptionsLoader={vehicleOptionsLoader}
      />
    </SessionProvider>,
  );
}

async function openAssignDialog() {
  fireEvent.click(await screen.findByRole("button", { name: /^assign$/i }));
}

function selectVehicleVerifierWithVehicle() {
  fireEvent.change(screen.getByLabelText(/^role$/i), {
    target: { value: "vehicleVerifier" },
  });
  fireEvent.change(screen.getByLabelText(/binding type/i), {
    target: { value: "vehicle" },
  });
}

beforeEach(() => {
  runtime.mode = "mock";
  adapterRef.current = null;
});

describe("assign dialog · vehicle anchor picker", () => {
  it("offers the live vehicle list instead of a free-text anchor id", async () => {
    const onSubmit = vi.fn();
    render(
      <AndroidDeviceAssignDialog
        open
        device={activeDevice()}
        onSubmit={onSubmit}
        onClose={() => {}}
        vehicleOptionsLoader={() => VEHICLE_OPTIONS}
      />,
    );
    selectVehicleVerifierWithVehicle();

    const picker = (await screen.findByLabelText(
      /^vehicle$/i,
    )) as HTMLSelectElement;
    expect(
      screen.queryByLabelText(/anchor id/i),
    ).toBeNull();
    expect(
      Array.from(picker.options).map((o) => o.textContent?.trim()),
    ).toEqual([
      "— pick a vehicle —",
      "А 014 ТУ 199 · Lada Vesta 2024",
      "В 220 ТО 199 · Lada Granta 2023 — decommissioned",
    ]);
  });

  it("submits the canonical vehicleId of the chosen vehicle as the anchor", async () => {
    const onSubmit = vi.fn();
    render(
      <AndroidDeviceAssignDialog
        open
        device={activeDevice()}
        onSubmit={onSubmit}
        onClose={() => {}}
        vehicleOptionsLoader={() => VEHICLE_OPTIONS}
      />,
    );
    selectVehicleVerifierWithVehicle();
    fireEvent.change(await screen.findByLabelText(/^vehicle$/i), {
      target: { value: VEHICLE_A },
    });
    fireEvent.click(screen.getByRole("button", { name: /save assignment/i }));

    expect(onSubmit).toHaveBeenCalledWith(DEVICE_ID, {
      role: "vehicleVerifier",
      binding: { type: "vehicle", anchorId: VEHICLE_A },
    });
  });

  it("cannot bind a decommissioned vehicle", async () => {
    render(
      <AndroidDeviceAssignDialog
        open
        device={activeDevice()}
        onSubmit={vi.fn()}
        onClose={() => {}}
        vehicleOptionsLoader={() => VEHICLE_OPTIONS}
      />,
    );
    selectVehicleVerifierWithVehicle();
    const picker = (await screen.findByLabelText(
      /^vehicle$/i,
    )) as HTMLSelectElement;
    const decommissioned = Array.from(picker.options).find((o) =>
      o.value === VEHICLE_B,
    );
    expect(decommissioned?.disabled).toBe(true);
  });

  it("keeps the role↔binding invariant: registrar never offers a vehicle target", async () => {
    render(
      <AndroidDeviceAssignDialog
        open
        device={activeDevice()}
        onSubmit={vi.fn()}
        onClose={() => {}}
        vehicleOptionsLoader={() => VEHICLE_OPTIONS}
      />,
    );
    fireEvent.change(screen.getByLabelText(/^role$/i), {
      target: { value: "registrar" },
    });
    const bindingSelect = screen.getByLabelText(
      /binding type/i,
    ) as HTMLSelectElement;
    expect(
      Array.from(bindingSelect.options)
        .map((o) => o.value)
        .filter((v) => v.length > 0),
    ).toEqual(["receptionPoint", "workstation"]);
    expect(screen.queryByLabelText(/^vehicle$/i)).toBeNull();
    // Reference-data anchors keep the UUID text input for now.
    expect(screen.getByLabelText(/anchor id/i)).toBeDefined();
  });

  it("surfaces a vehicle-registry failure through the error taxonomy with a retry", async () => {
    const loader = vi
      .fn<() => VehicleAnchorOption[]>()
      .mockImplementationOnce(() => {
        throw apiError(503, "SERVICE_DEGRADED");
      })
      .mockImplementation(() => VEHICLE_OPTIONS);

    render(
      <AndroidDeviceAssignDialog
        open
        device={activeDevice()}
        onSubmit={vi.fn()}
        onClose={() => {}}
        vehicleOptionsLoader={loader}
      />,
    );
    selectVehicleVerifierWithVehicle();

    expect(
      await screen.findByText(/backend is degraded/i),
    ).toBeDefined();
    // No silent fallback to free-text entry while the list is down.
    expect(screen.queryByLabelText(/anchor id/i)).toBeNull();

    fireEvent.click(
      screen.getByRole("button", { name: /retry vehicle list/i }),
    );
    expect(await screen.findByLabelText(/^vehicle$/i)).toBeDefined();
  });

  it("says so explicitly when the registry returns no vehicles", async () => {
    render(
      <AndroidDeviceAssignDialog
        open
        device={activeDevice()}
        onSubmit={vi.fn()}
        onClose={() => {}}
        vehicleOptionsLoader={() => []}
      />,
    );
    selectVehicleVerifierWithVehicle();
    expect(
      await screen.findByText(/returned no vehicles/i),
    ).toBeDefined();
  });

  it("shows a current binding the registry no longer lists instead of blanking it", async () => {
    const bound = activeDevice({
      role: "vehicleVerifier",
      roleLabel: "vehicleVerifier",
      binding: {
        type: "vehicle",
        anchorId: "99999999-9999-4999-8999-999999999999",
        anchorLabel: "99999999-9999-4999-8999-999999999999",
      },
    });
    render(
      <AndroidDeviceAssignDialog
        open
        device={bound}
        onSubmit={vi.fn()}
        onClose={() => {}}
        vehicleOptionsLoader={() => VEHICLE_OPTIONS}
      />,
    );
    expect(
      await screen.findByText(/current binding \(not in the vehicle registry\)/i),
    ).toBeDefined();
  });
});

describe("device commands · live mode", () => {
  it("assign dispatches the live POST and takes the new state from the response", async () => {
    runtime.mode = "live";
    const POST = vi.fn(async () => ({ data: assignedDeviceDto() }));
    adapterRef.current = androidApi(POST);

    renderScreen({});
    await openAssignDialog();
    selectVehicleVerifierWithVehicle();
    fireEvent.change(await screen.findByLabelText(/^vehicle$/i), {
      target: { value: VEHICLE_A },
    });
    fireEvent.click(screen.getByRole("button", { name: /save assignment/i }));

    await waitFor(() => expect(POST).toHaveBeenCalledTimes(1));
    const [path, init] = POST.mock.calls[0] as unknown as [
      string,
      {
        params: {
          path: { deviceId: string };
          header: Record<string, string>;
        };
        body: unknown;
      },
    ];
    expect(path).toBe("/admin/devices/{deviceId}/assign");
    expect(init.params.path.deviceId).toBe(DEVICE_ID);
    expect(init.params.header["Idempotency-Key"]).toMatch(/\S/);
    expect(init.body).toEqual({
      role: "vehicleVerifier",
      binding: { type: "vehicle", anchorId: VEHICLE_A },
    });

    // The row reflects the backend-stamped policyVersion 9, which the
    // console never guessed locally.
    expect((await screen.findAllByText("v9")).length).toBeGreaterThan(0);
    expect(
      await screen.findByText(`vehicle · ${VEHICLE_A}`),
    ).toBeDefined();
  });

  it("retire dispatches the live POST and takes the new state from the response", async () => {
    runtime.mode = "live";
    const POST = vi.fn(async () => ({
      data: {
        ...assignedDeviceDto(),
        status: "retired",
        retiredAt: "2026-08-09T12:00:00Z",
      },
    }));
    adapterRef.current = androidApi(POST);

    renderScreen({});
    fireEvent.click(await screen.findByRole("button", { name: /^retire$/i }));
    fireEvent.change(screen.getByLabelText(/audit reason/i), {
      target: { value: "pilot teardown" },
    });
    fireEvent.click(
      screen.getByRole("button", { name: /^retire device$/i }),
    );
    fireEvent.click(
      screen.getByRole("button", { name: /confirm & retire/i }),
    );

    await waitFor(() => expect(POST).toHaveBeenCalledTimes(1));
    const [path, init] = POST.mock.calls[0] as unknown as [
      string,
      {
        params: { header: Record<string, string> };
        body: unknown;
      },
    ];
    expect(path).toBe("/admin/devices/{deviceId}/retire");
    expect(init.params.header["Idempotency-Key"]).toMatch(/\S/);
    expect(init.body).toEqual({ reason: "pilot teardown" });
    expect(
      await screen.findByText(/1 devices · 0 pending · 0 active · 1 retired/i),
    ).toBeDefined();
  });

  it("409 keeps the list visible and offers a reload", async () => {
    runtime.mode = "live";
    const POST = vi.fn(async () => {
      throw apiError(409, "RESOURCE_CONFLICT");
    });
    adapterRef.current = androidApi(POST);
    const loader = vi.fn(() => snapshot());

    renderScreen({ loader });
    fireEvent.click(await screen.findByRole("button", { name: /^retire$/i }));
    fireEvent.click(
      screen.getByRole("button", { name: /^retire device$/i }),
    );
    fireEvent.click(
      screen.getByRole("button", { name: /confirm & retire/i }),
    );

    const banner = await screen.findByRole("alert", {
      name: /device command failed/i,
    });
    expect(banner.textContent).toMatch(/conflict with current state/i);
    expect(banner.textContent).toMatch(/reload to see its current state/i);
    // The list is still there — a rejected write does not wipe the
    // workspace.
    expect(screen.getByRole("table")).toBeDefined();

    const loadsBefore = loader.mock.calls.length;
    fireEvent.click(
      screen.getByRole("button", { name: /reload devices/i }),
    );
    await waitFor(() =>
      expect(loader.mock.calls.length).toBe(loadsBefore + 1),
    );
    await waitFor(() =>
      expect(
        screen.queryByRole("alert", { name: /device command failed/i }),
      ).toBeNull(),
    );
  });

  it("403 on a command renders the forbidden state, not a generic error", async () => {
    runtime.mode = "live";
    adapterRef.current = androidApi(
      vi.fn(async () => {
        throw apiError(403, "FORBIDDEN");
      }),
    );

    renderScreen({});
    fireEvent.click(await screen.findByRole("button", { name: /^retire$/i }));
    fireEvent.click(
      screen.getByRole("button", { name: /^retire device$/i }),
    );
    fireEvent.click(
      screen.getByRole("button", { name: /confirm & retire/i }),
    );

    const banner = await screen.findByRole("alert", {
      name: /device command failed/i,
    });
    expect(banner.textContent).toMatch(/access denied/i);
  });

  it("degraded backend surfaces the degraded state over the device list", async () => {
    runtime.mode = "live";
    adapterRef.current = androidApi(
      vi.fn(async () => {
        throw apiError(503, "ANDROID_DEVICE_NOT_IMPLEMENTED");
      }),
    );

    renderScreen({});
    fireEvent.click(await screen.findByRole("button", { name: /^retire$/i }));
    fireEvent.click(
      screen.getByRole("button", { name: /^retire device$/i }),
    );
    fireEvent.click(
      screen.getByRole("button", { name: /confirm & retire/i }),
    );

    const banner = await screen.findByRole("alert", {
      name: /device command failed/i,
    });
    expect(banner.textContent).toMatch(/backend is degraded/i);
    expect(screen.getByRole("table")).toBeDefined();
  });
});

describe("device commands · mock mode", () => {
  it("does not touch the network and mutates the local snapshot", async () => {
    runtime.mode = "mock";
    const POST = vi.fn();
    adapterRef.current = androidApi(POST);

    renderScreen({});
    fireEvent.click(await screen.findByRole("button", { name: /^retire$/i }));
    fireEvent.click(
      screen.getByRole("button", { name: /^retire device$/i }),
    );
    fireEvent.click(
      screen.getByRole("button", { name: /confirm & retire/i }),
    );

    expect(
      await screen.findByText(/1 devices · 0 pending · 0 active · 1 retired/i),
    ).toBeDefined();
    expect(POST).not.toHaveBeenCalled();
  });
});

describe("device.manage gating", () => {
  it("disables assign / retire / policy with a visible reason", async () => {
    renderScreen({ permissions: ["audit.read"] });
    const assign = (await screen.findByRole("button", {
      name: /^assign$/i,
    })) as HTMLButtonElement;
    const retire = screen.getByRole("button", {
      name: /^retire$/i,
    }) as HTMLButtonElement;
    const policy = screen.getByRole("button", {
      name: /^edit policy$/i,
    }) as HTMLButtonElement;

    expect(assign.disabled).toBe(true);
    expect(retire.disabled).toBe(true);
    expect(policy.disabled).toBe(true);
    // Visible on the screen, not only in a title attribute.
    expect(
      screen.getByText(/you need the device\.manage permission/i),
    ).toBeDefined();
  });

  it("enables the commands for an operator holding device.manage", async () => {
    renderScreen({ permissions: ["device.manage"] });
    const assign = (await screen.findByRole("button", {
      name: /^assign$/i,
    })) as HTMLButtonElement;
    expect(assign.disabled).toBe(false);
    expect(
      screen.queryByText(/you need the device\.manage permission/i),
    ).toBeNull();
  });
});

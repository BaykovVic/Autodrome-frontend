import { describe, expect, it, vi } from "vitest";

import { ApiError } from "@/api/errors";
import {
  liveAndroidDeviceApplyPolicy,
  liveAndroidDeviceAssign,
  liveAndroidDeviceGet,
  liveAndroidDeviceRetire,
  liveAndroidDevicesLoader,
  mapAndroidDeviceBindingDtoToConsole,
  mapAndroidDeviceCapabilityPolicyDtoToConsole,
  mapAndroidDeviceDtoToConsole,
  policyUpdateBody,
} from "@/app/(shell)/devices/_components/liveAndroidDevicesLoader";
import type { AutodromeApi } from "@/api/adapter";
import type { components } from "@/contracts/types/android-device-management";

type AndroidDeviceDto = components["schemas"]["AndroidDevice"];

function makeDto(
  over: Partial<AndroidDeviceDto> = {},
): AndroidDeviceDto {
  return {
    deviceId: "00000000-0000-0000-0000-0000000000a1",
    status: "active",
    role: "registrar",
    binding: {
      type: "receptionPoint",
      anchorId: "RPT-A",
    },
    policy: {
      policyVersion: 4,
      disabledCapabilities: ["diagnostics"],
      policyReason: "pilot rollout",
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
    lastSeenAt: "2026-06-22T11:42:18Z",
    lastHeartbeat: {
      capturedAt: "2026-06-22T11:42:00Z",
      status: "online",
      batteryLevel: 0.62,
      batteryCharging: true,
      networkType: "wifi",
    },
    ...over,
  };
}

function makeApi(
  androidDevice: Partial<AutodromeApi["androidDevice"]>,
): AutodromeApi {
  return { androidDevice } as unknown as AutodromeApi;
}

describe("mapAndroidDeviceDtoToConsole", () => {
  it("maps an active device through the full canonical shape", () => {
    const v = mapAndroidDeviceDtoToConsole(makeDto());
    expect(v.id).toBe("00000000-0000-0000-0000-0000000000a1");
    expect(v.status).toBe("active");
    expect(v.statusLabel).toBe("active");
    expect(v.role).toBe("registrar");
    expect(v.roleLabel).toBe("registrar");
    expect(v.binding?.type).toBe("receptionPoint");
    expect(v.binding?.anchorId).toBe("RPT-A");
    expect(v.policy?.policyVersion).toBe(4);
    expect(v.policy?.disabledCapabilities).toEqual(["diagnostics"]);
    expect(v.policy?.policyReason).toBe("pilot rollout");
    expect(v.heartbeat?.status).toBe("online");
    expect(v.heartbeat?.batteryLevel).toBe(0.62);
    expect(v.heartbeat?.networkType).toBe("wifi");
    expect(v.platform.appVersion).toBe("0.9.0");
  });

  it("maps pending device without role/binding/policy", () => {
    const v = mapAndroidDeviceDtoToConsole(
      makeDto({
        status: "pending",
        role: undefined,
        binding: undefined,
        policy: undefined,
        assignedAt: undefined,
        lastSeenAt: undefined,
        lastHeartbeat: undefined,
      }),
    );
    expect(v.status).toBe("pending");
    expect(v.role).toBeUndefined();
    expect(v.binding).toBeUndefined();
    expect(v.policy).toBeUndefined();
    expect(v.heartbeat).toBeUndefined();
  });

  it("falls back to anchorId when no anchorLabel override is supplied", () => {
    const v = mapAndroidDeviceDtoToConsole(makeDto());
    expect(v.binding?.anchorLabel).toBe("RPT-A");
  });

  it("uses supplied anchorLabel override when provided", () => {
    const v = mapAndroidDeviceDtoToConsole(makeDto(), {
      anchorLabel: "Reception A",
    });
    expect(v.binding?.anchorLabel).toBe("Reception A");
  });

  it("falls back heartbeat to offline when only lastSeenAt is present (no lastHeartbeat)", () => {
    const v = mapAndroidDeviceDtoToConsole(
      makeDto({ lastHeartbeat: undefined }),
    );
    expect(v.heartbeat?.status).toBe("offline");
    expect(v.heartbeat?.lastSeenAt).toBe("2026-06-22T11:42:18Z");
  });

  it("maps retired device with retiredAt timestamp", () => {
    const v = mapAndroidDeviceDtoToConsole(
      makeDto({
        status: "retired",
        retiredAt: "2026-06-10T15:00:00Z",
      }),
    );
    expect(v.status).toBe("retired");
    expect(v.retiredAt).toBe("2026-06-10T15:00:00Z");
  });
});

describe("mapAndroidDeviceBindingDtoToConsole", () => {
  it("preserves canonical binding type values", () => {
    expect(
      mapAndroidDeviceBindingDtoToConsole({
        type: "receptionPoint",
        anchorId: "RPT-1",
      }).type,
    ).toBe("receptionPoint");
    expect(
      mapAndroidDeviceBindingDtoToConsole({
        type: "workstation",
        anchorId: "WS-1",
      }).type,
    ).toBe("workstation");
    expect(
      mapAndroidDeviceBindingDtoToConsole({
        type: "vehicle",
        anchorId: "VEH-1",
      }).type,
    ).toBe("vehicle");
  });
});

describe("mapAndroidDeviceCapabilityPolicyDtoToConsole", () => {
  it("clones disabledCapabilities (no aliasing)", () => {
    const dto = {
      policyVersion: 1,
      disabledCapabilities: ["diagnostics"] as readonly string[],
    } as components["schemas"]["AndroidDeviceCapabilityPolicy"];
    const policy = mapAndroidDeviceCapabilityPolicyDtoToConsole(dto);
    (policy.disabledCapabilities as string[]).push("settings");
    expect(dto.disabledCapabilities).toEqual(["diagnostics"]);
  });

  it("omits policyReason and updatedAt when undefined", () => {
    const policy = mapAndroidDeviceCapabilityPolicyDtoToConsole({
      policyVersion: 2,
      disabledCapabilities: [],
    });
    expect("policyReason" in policy).toBe(false);
    expect("updatedAt" in policy).toBe(false);
  });
});

describe("liveAndroidDevicesLoader (admin list)", () => {
  it("returns snapshot with totals and mapped devices", async () => {
    const GET = vi.fn(async () => ({
      data: {
        items: [
          makeDto({ deviceId: "d-1", status: "pending", role: undefined, binding: undefined, policy: undefined }),
          makeDto({ deviceId: "d-2", status: "active" }),
          makeDto({ deviceId: "d-3", status: "active" }),
          makeDto({ deviceId: "d-4", status: "retired", retiredAt: "2026-06-10T15:00:00Z" }),
        ],
      },
    }));
    const api = makeApi({
      GET: GET as unknown as AutodromeApi["androidDevice"]["GET"],
    });

    const snapshot = await liveAndroidDevicesLoader(api);
    expect(GET).toHaveBeenCalledWith("/admin/devices", {});
    expect(snapshot.totals).toEqual({
      devices: 4,
      pending: 1,
      active: 2,
      retired: 1,
    });
    expect(snapshot.devices.map((d) => d.id)).toEqual([
      "d-1",
      "d-2",
      "d-3",
      "d-4",
    ]);
  });

  it("returns empty snapshot for empty page", async () => {
    const GET = vi.fn(async () => ({ data: { items: [] } }));
    const api = makeApi({
      GET: GET as unknown as AutodromeApi["androidDevice"]["GET"],
    });
    const snapshot = await liveAndroidDevicesLoader(api);
    expect(snapshot.totals).toEqual({
      devices: 0,
      pending: 0,
      active: 0,
      retired: 0,
    });
    expect(snapshot.devices).toEqual([]);
  });

  it("propagates 503 SERVICE_DEGRADED / ANDROID_DEVICE_NOT_IMPLEMENTED ApiError", async () => {
    const GET = vi.fn(() => {
      throw new ApiError({
        status: 503,
        code: "ANDROID_DEVICE_NOT_IMPLEMENTED",
        message: "Admin endpoints not implemented yet",
        url: "/api/android-device-management/v1/admin/devices",
      });
    });
    const api = makeApi({
      GET: GET as unknown as AutodromeApi["androidDevice"]["GET"],
    });
    await expect(liveAndroidDevicesLoader(api)).rejects.toBeInstanceOf(
      ApiError,
    );
    await expect(liveAndroidDevicesLoader(api)).rejects.toMatchObject({
      code: "ANDROID_DEVICE_NOT_IMPLEMENTED",
    });
  });

  it("propagates generic 500 ApiError", async () => {
    const GET = vi.fn(() => {
      throw new ApiError({
        status: 500,
        code: "HTTP_500",
        message: "internal",
        url: "/api/android-device-management/v1/admin/devices",
      });
    });
    const api = makeApi({
      GET: GET as unknown as AutodromeApi["androidDevice"]["GET"],
    });
    await expect(liveAndroidDevicesLoader(api)).rejects.toBeInstanceOf(
      ApiError,
    );
  });
});

describe("liveAndroidDeviceGet", () => {
  it("passes path param and maps DTO", async () => {
    const dto = makeDto({ deviceId: "d-X" });
    const GET = vi.fn(async () => ({ data: dto }));
    const api = makeApi({
      GET: GET as unknown as AutodromeApi["androidDevice"]["GET"],
    });

    const v = await liveAndroidDeviceGet(api, "d-X");

    expect(GET).toHaveBeenCalledWith("/admin/devices/{deviceId}", {
      params: { path: { deviceId: "d-X" } },
    });
    expect(v.id).toBe("d-X");
  });

  it("throws on empty body", async () => {
    const GET = vi.fn(async () => ({ data: undefined }));
    const api = makeApi({
      GET: GET as unknown as AutodromeApi["androidDevice"]["GET"],
    });
    await expect(liveAndroidDeviceGet(api, "d-Z")).rejects.toThrow(
      /empty body/i,
    );
  });
});

describe("liveAndroidDeviceAssign", () => {
  it("POSTs to /admin/devices/{id}/assign with body + Idempotency-Key", async () => {
    const created = makeDto({ deviceId: "d-NEW", status: "active" });
    const POST = vi.fn(async () => ({ data: created }));
    const api = makeApi({
      POST: POST as unknown as AutodromeApi["androidDevice"]["POST"],
    });

    const body: components["schemas"]["AndroidDeviceAssignment"] = {
      role: "registrar",
      binding: { type: "receptionPoint", anchorId: "RPT-A" },
      policy: {
        disabledCapabilities: ["diagnostics"],
        policyReason: "pilot",
      },
    };
    const v = await liveAndroidDeviceAssign(api, "d-NEW", body);

    expect(POST).toHaveBeenCalledTimes(1);
    const [path, opts] = POST.mock.calls[0] as unknown as [
      string,
      {
        params: {
          path: { deviceId: string };
          header: { "Idempotency-Key": string };
        };
        body: components["schemas"]["AndroidDeviceAssignment"];
      },
    ];
    expect(path).toBe("/admin/devices/{deviceId}/assign");
    expect(opts.params.path.deviceId).toBe("d-NEW");
    expect(opts.params.header["Idempotency-Key"]).toMatch(/.+/);
    expect(opts.body).toEqual(body);
    expect(v.id).toBe("d-NEW");
  });

  it("each assign call uses a fresh Idempotency-Key", async () => {
    const POST = vi.fn(async () => ({ data: makeDto() }));
    const api = makeApi({
      POST: POST as unknown as AutodromeApi["androidDevice"]["POST"],
    });
    const body: components["schemas"]["AndroidDeviceAssignment"] = {
      role: "registrar",
      binding: { type: "workstation", anchorId: "WS-1" },
    };
    await liveAndroidDeviceAssign(api, "d-1", body);
    await liveAndroidDeviceAssign(api, "d-1", body);
    const [, opts1] = POST.mock.calls[0] as unknown as [
      string,
      { params: { header: { "Idempotency-Key": string } } },
    ];
    const [, opts2] = POST.mock.calls[1] as unknown as [
      string,
      { params: { header: { "Idempotency-Key": string } } },
    ];
    expect(opts1.params.header["Idempotency-Key"]).not.toBe(
      opts2.params.header["Idempotency-Key"],
    );
  });

  it("throws on empty body", async () => {
    const POST = vi.fn(async () => ({ data: undefined }));
    const api = makeApi({
      POST: POST as unknown as AutodromeApi["androidDevice"]["POST"],
    });
    await expect(
      liveAndroidDeviceAssign(api, "d-X", {
        role: "registrar",
        binding: { type: "receptionPoint", anchorId: "x" },
      }),
    ).rejects.toThrow(/empty body/i);
  });

  it("propagates ApiError including 503 backend-lag", async () => {
    const POST = vi.fn(() => {
      throw new ApiError({
        status: 503,
        code: "ANDROID_DEVICE_NOT_IMPLEMENTED",
        message: "assign not implemented yet",
        url: "/api/android-device-management/v1/admin/devices/d-X/assign",
      });
    });
    const api = makeApi({
      POST: POST as unknown as AutodromeApi["androidDevice"]["POST"],
    });
    await expect(
      liveAndroidDeviceAssign(api, "d-X", {
        role: "registrar",
        binding: { type: "receptionPoint", anchorId: "x" },
      }),
    ).rejects.toBeInstanceOf(ApiError);
  });
});

describe("policyUpdateBody / liveAndroidDeviceApplyPolicy", () => {
  it("policyUpdateBody trims to canonical write shape (disabled + reason)", () => {
    const update = policyUpdateBody({
      policyVersion: 99,
      disabledCapabilities: ["diagnostics", "settings"],
      policyReason: "pilot",
      updatedAt: "2026-06-22T08:00:00Z",
    });
    expect(update).toEqual({
      disabledCapabilities: ["diagnostics", "settings"],
      policyReason: "pilot",
    });
    expect("policyVersion" in update).toBe(false);
    expect("updatedAt" in update).toBe(false);
  });

  it("policyUpdateBody omits policyReason when absent", () => {
    const update = policyUpdateBody({
      policyVersion: 1,
      disabledCapabilities: [],
    });
    expect("policyReason" in update).toBe(false);
  });

  it("liveAndroidDeviceApplyPolicy threads device role + binding into the assign body", async () => {
    const dto = makeDto({
      deviceId: "d-1",
      status: "active",
      role: "vehicleVerifier",
      binding: { type: "vehicle", anchorId: "VEH-1" },
      policy: {
        policyVersion: 5,
        disabledCapabilities: ["settings"],
        policyReason: "pilot",
      },
    });
    const POST = vi.fn(async () => ({ data: dto }));
    const api = makeApi({
      POST: POST as unknown as AutodromeApi["androidDevice"]["POST"],
    });

    await liveAndroidDeviceApplyPolicy(
      api,
      {
        id: "d-1",
        status: "active",
        statusLabel: "active",
        role: "vehicleVerifier",
        roleLabel: "vehicleVerifier",
        binding: {
          type: "vehicle",
          anchorId: "VEH-1",
          anchorLabel: "VEH-1",
        },
        platform: {
          manufacturer: "Lenovo",
          model: "Tab P11",
          osVersion: "Android 13",
          appVersion: "0.9.0",
        },
        registeredAt: "2026-06-01T08:00:00Z",
      },
      {
        policyVersion: 4,
        disabledCapabilities: ["settings", "devicePairing"],
        policyReason: "field tablet",
      },
    );

    const [, opts] = POST.mock.calls[0] as unknown as [
      string,
      {
        body: components["schemas"]["AndroidDeviceAssignment"];
      },
    ];
    expect(opts.body.role).toBe("vehicleVerifier");
    expect(opts.body.binding).toEqual({
      type: "vehicle",
      anchorId: "VEH-1",
    });
    expect(opts.body.policy).toEqual({
      disabledCapabilities: ["settings", "devicePairing"],
      policyReason: "field tablet",
    });
  });

  it("liveAndroidDeviceApplyPolicy throws when device has no role/binding", async () => {
    const api = makeApi({});
    await expect(
      liveAndroidDeviceApplyPolicy(
        api,
        {
          id: "d-1",
          status: "pending",
          statusLabel: "pending",
          platform: {
            manufacturer: "X",
            model: "X",
            osVersion: "X",
            appVersion: "0.0.0",
          },
          registeredAt: "2026-06-01T00:00:00Z",
        },
        { policyVersion: 1, disabledCapabilities: [] },
      ),
    ).rejects.toThrow(/role or binding/i);
  });
});

describe("liveAndroidDeviceRetire", () => {
  it("POSTs to /admin/devices/{id}/retire with optional reason + Idempotency-Key", async () => {
    const dto = makeDto({
      deviceId: "d-R",
      status: "retired",
      retiredAt: "2026-06-24T18:00:00Z",
    });
    const POST = vi.fn(async () => ({ data: dto }));
    const api = makeApi({
      POST: POST as unknown as AutodromeApi["androidDevice"]["POST"],
    });

    const v = await liveAndroidDeviceRetire(api, "d-R", {
      reason: "Decommissioned during pilot rotation",
    });

    const [path, opts] = POST.mock.calls[0] as unknown as [
      string,
      {
        params: {
          path: { deviceId: string };
          header: { "Idempotency-Key": string };
        };
        body: components["schemas"]["AndroidDeviceRetireRequest"];
      },
    ];
    expect(path).toBe("/admin/devices/{deviceId}/retire");
    expect(opts.params.path.deviceId).toBe("d-R");
    expect(opts.params.header["Idempotency-Key"]).toMatch(/.+/);
    expect(opts.body.reason).toBe("Decommissioned during pilot rotation");
    expect(v.status).toBe("retired");
  });

  it("defaults body to empty object when no reason supplied", async () => {
    const POST = vi.fn(async () =>
      ({ data: makeDto({ status: "retired" }) }),
    );
    const api = makeApi({
      POST: POST as unknown as AutodromeApi["androidDevice"]["POST"],
    });
    await liveAndroidDeviceRetire(api, "d-R");
    const [, opts] = POST.mock.calls[0] as unknown as [
      string,
      { body: components["schemas"]["AndroidDeviceRetireRequest"] },
    ];
    expect(opts.body).toEqual({});
  });

  it("throws on empty body", async () => {
    const POST = vi.fn(async () => ({ data: undefined }));
    const api = makeApi({
      POST: POST as unknown as AutodromeApi["androidDevice"]["POST"],
    });
    await expect(liveAndroidDeviceRetire(api, "d-R")).rejects.toThrow(
      /empty body/i,
    );
  });

  it("propagates ApiError including 503 backend-lag", async () => {
    const POST = vi.fn(() => {
      throw new ApiError({
        status: 503,
        code: "ANDROID_DEVICE_NOT_IMPLEMENTED",
        message: "retire not implemented yet",
        url: "/api/android-device-management/v1/admin/devices/d-R/retire",
      });
    });
    const api = makeApi({
      POST: POST as unknown as AutodromeApi["androidDevice"]["POST"],
    });
    await expect(
      liveAndroidDeviceRetire(api, "d-R"),
    ).rejects.toBeInstanceOf(ApiError);
  });
});

// Track 1 / Android Device Heartbeat Reconciliation focused
// regression suite. The mapper already handles the canonical
// heartbeat projection (since the live API integration baseline);
// these cases lock the empty / partial / full / edge-case
// behaviour against silent drift after the backend heartbeat
// baseline ships its application layer.
describe("heartbeat projection (empty / partial / full DTO shapes)", () => {
  it("empty: no lastSeenAt AND no lastHeartbeat → console heartbeat undefined", () => {
    const v = mapAndroidDeviceDtoToConsole(
      makeDto({ lastSeenAt: undefined, lastHeartbeat: undefined }),
    );
    expect(v.heartbeat).toBeUndefined();
  });

  it("partial: only lastSeenAt (no lastHeartbeat) → honest offline fallback", () => {
    const v = mapAndroidDeviceDtoToConsole(
      makeDto({
        lastSeenAt: "2026-06-22T12:00:00Z",
        lastHeartbeat: undefined,
      }),
    );
    expect(v.heartbeat).toBeDefined();
    expect(v.heartbeat?.lastSeenAt).toBe("2026-06-22T12:00:00Z");
    expect(v.heartbeat?.status).toBe("offline");
    expect(v.heartbeat?.batteryLevel).toBeUndefined();
    expect(v.heartbeat?.batteryCharging).toBeUndefined();
    expect(v.heartbeat?.networkType).toBeUndefined();
  });

  it("partial: lastHeartbeat without status → falls back to offline", () => {
    const v = mapAndroidDeviceDtoToConsole(
      makeDto({
        lastSeenAt: "2026-06-22T12:00:00Z",
        lastHeartbeat: { capturedAt: "2026-06-22T11:59:00Z" },
      }),
    );
    expect(v.heartbeat?.status).toBe("offline");
  });

  it("partial: lastHeartbeat with only status (no battery/network) → optional fields omitted", () => {
    const v = mapAndroidDeviceDtoToConsole(
      makeDto({
        lastSeenAt: "2026-06-22T12:00:00Z",
        lastHeartbeat: {
          capturedAt: "2026-06-22T11:59:00Z",
          status: "online",
        },
      }),
    );
    expect(v.heartbeat?.status).toBe("online");
    expect(v.heartbeat?.batteryLevel).toBeUndefined();
    expect(v.heartbeat?.batteryCharging).toBeUndefined();
    expect(v.heartbeat?.networkType).toBeUndefined();
  });

  it("edge: batteryLevel=0 preserved (regression guard against truthy-skip)", () => {
    const v = mapAndroidDeviceDtoToConsole(
      makeDto({
        lastSeenAt: "2026-06-22T12:00:00Z",
        lastHeartbeat: {
          capturedAt: "2026-06-22T11:59:00Z",
          status: "offline",
          batteryLevel: 0,
        },
      }),
    );
    expect(v.heartbeat?.batteryLevel).toBe(0);
  });

  it("edge: batteryCharging=false preserved (not coerced to undefined)", () => {
    const v = mapAndroidDeviceDtoToConsole(
      makeDto({
        lastSeenAt: "2026-06-22T12:00:00Z",
        lastHeartbeat: {
          capturedAt: "2026-06-22T11:59:00Z",
          status: "online",
          batteryLevel: 0.5,
          batteryCharging: false,
        },
      }),
    );
    expect(v.heartbeat?.batteryCharging).toBe(false);
  });

  it("edge: networkType='none' preserved (offline-network device)", () => {
    const v = mapAndroidDeviceDtoToConsole(
      makeDto({
        lastSeenAt: "2026-06-22T12:00:00Z",
        lastHeartbeat: {
          capturedAt: "2026-06-22T11:59:00Z",
          status: "degraded",
          networkType: "none",
        },
      }),
    );
    expect(v.heartbeat?.networkType).toBe("none");
  });

  it("full: all canonical heartbeat fields propagate end-to-end", () => {
    const v = mapAndroidDeviceDtoToConsole(
      makeDto({
        lastSeenAt: "2026-06-22T12:00:00Z",
        lastHeartbeat: {
          capturedAt: "2026-06-22T11:59:00Z",
          status: "online",
          batteryLevel: 0.84,
          batteryCharging: true,
          networkType: "wifi",
        },
      }),
    );
    expect(v.heartbeat).toEqual({
      lastSeenAt: "2026-06-22T12:00:00Z",
      status: "online",
      batteryLevel: 0.84,
      batteryCharging: true,
      networkType: "wifi",
    });
  });

  it("full: all canonical networkType enum values pass through unchanged", () => {
    for (const networkType of [
      "wifi",
      "cellular",
      "ethernet",
      "none",
      "other",
    ] as const) {
      const v = mapAndroidDeviceDtoToConsole(
        makeDto({
          lastSeenAt: "2026-06-22T12:00:00Z",
          lastHeartbeat: {
            capturedAt: "2026-06-22T11:59:00Z",
            status: "online",
            networkType,
          },
        }),
      );
      expect(v.heartbeat?.networkType).toBe(networkType);
    }
  });

  it("full: all canonical heartbeat status enum values pass through unchanged", () => {
    for (const status of ["online", "offline", "degraded"] as const) {
      const v = mapAndroidDeviceDtoToConsole(
        makeDto({
          lastSeenAt: "2026-06-22T12:00:00Z",
          lastHeartbeat: { capturedAt: "now", status },
        }),
      );
      expect(v.heartbeat?.status).toBe(status);
    }
  });
});

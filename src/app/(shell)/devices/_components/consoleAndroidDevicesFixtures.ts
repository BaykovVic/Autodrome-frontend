import type { MockScenario } from "@/api/mock/scenarios";
import type {
  ConsoleAndroidDevice,
  ConsoleAndroidDevicesSnapshot,
} from "./consoleAndroidDevicesSnapshot";

/**
 * Mock-first device list used by the Android Devices workspace.
 * The shape matches the canonical
 * `android-device-management-service` v1 AndroidDevice DTO so
 * a future live loader replaces these fixtures without any
 * downstream change to the screen.
 */
const DEVICES: ConsoleAndroidDevice[] = [
  {
    id: "AD-7F02-PEND",
    status: "pending",
    statusLabel: "pending",
    platform: {
      manufacturer: "Samsung",
      model: "Galaxy Tab S9",
      osVersion: "Android 14",
      appVersion: "0.9.1",
    },
    registeredAt: "2026-06-22T07:14:00Z",
    heartbeat: {
      lastSeenAt: "2026-06-22T07:14:00Z",
      status: "online",
      batteryLevel: 0.78,
      batteryCharging: false,
      networkType: "wifi",
    },
  },
  {
    id: "AD-3A11-REG",
    status: "active",
    statusLabel: "active",
    role: "registrar",
    roleLabel: "registrar",
    binding: {
      type: "receptionPoint",
      anchorId: "RPT-LOBBY-A",
      anchorLabel: "Lobby reception A",
    },
    policy: {
      policyVersion: 4,
      disabledCapabilities: ["diagnostics"],
      policyReason: "Operator-only diagnostics during pilot rollout.",
      updatedAt: "2026-06-22T08:10:00Z",
    },
    platform: {
      manufacturer: "Samsung",
      model: "Galaxy Tab S9",
      osVersion: "Android 14",
      appVersion: "0.9.0",
    },
    registeredAt: "2026-06-15T09:00:00Z",
    assignedAt: "2026-06-15T11:30:00Z",
    heartbeat: {
      lastSeenAt: "2026-06-22T11:42:18Z",
      status: "online",
      batteryLevel: 0.62,
      batteryCharging: true,
      networkType: "wifi",
    },
  },
  {
    id: "AD-5C82-REG",
    status: "active",
    statusLabel: "active",
    role: "registrar",
    roleLabel: "registrar",
    binding: {
      type: "workstation",
      anchorId: "WS-NODE-A-04",
      anchorLabel: "Workstation NODE-A · 04",
    },
    policy: {
      policyVersion: 2,
      disabledCapabilities: [],
      updatedAt: "2026-06-18T09:00:00Z",
    },
    platform: {
      manufacturer: "Samsung",
      model: "Galaxy Tab S8",
      osVersion: "Android 13",
      appVersion: "0.9.0",
    },
    registeredAt: "2026-05-29T12:00:00Z",
    assignedAt: "2026-05-29T14:00:00Z",
    heartbeat: {
      lastSeenAt: "2026-06-22T11:38:02Z",
      status: "degraded",
      batteryLevel: 0.18,
      batteryCharging: false,
      networkType: "cellular",
    },
  },
  {
    id: "AD-9D14-VV",
    status: "active",
    statusLabel: "active",
    role: "vehicleVerifier",
    roleLabel: "vehicleVerifier",
    binding: {
      type: "vehicle",
      anchorId: "VEH-A-100",
      anchorLabel: "Renault Logan · AA 100",
    },
    policy: {
      policyVersion: 6,
      disabledCapabilities: ["settings", "devicePairing"],
      policyReason:
        "Field tablet locked to verification workflow. Pairing re-enabled at depot only.",
      updatedAt: "2026-06-21T17:25:00Z",
    },
    platform: {
      manufacturer: "Lenovo",
      model: "Tab P11",
      osVersion: "Android 13",
      appVersion: "0.9.0",
    },
    registeredAt: "2026-06-01T08:00:00Z",
    assignedAt: "2026-06-01T10:00:00Z",
    heartbeat: {
      lastSeenAt: "2026-06-22T11:35:11Z",
      status: "online",
      batteryLevel: 0.91,
      batteryCharging: false,
      networkType: "cellular",
    },
  },
  {
    id: "AD-1B40-VV",
    status: "active",
    statusLabel: "active",
    role: "vehicleVerifier",
    roleLabel: "vehicleVerifier",
    binding: {
      type: "vehicle",
      anchorId: "VEH-B-218",
      anchorLabel: "VW Polo · BB 218",
    },
    policy: {
      policyVersion: 3,
      disabledCapabilities: [],
      updatedAt: "2026-06-19T11:00:00Z",
    },
    platform: {
      manufacturer: "Lenovo",
      model: "Tab P11",
      osVersion: "Android 13",
      appVersion: "0.9.0",
    },
    registeredAt: "2026-06-04T07:30:00Z",
    assignedAt: "2026-06-04T09:00:00Z",
    heartbeat: {
      lastSeenAt: "2026-06-21T17:02:55Z",
      status: "offline",
      batteryLevel: 0.04,
      batteryCharging: false,
      networkType: "none",
    },
  },
  {
    id: "AD-2E55-RET",
    status: "retired",
    statusLabel: "retired",
    role: "registrar",
    roleLabel: "registrar",
    binding: {
      type: "workstation",
      anchorId: "WS-NODE-B-01",
      anchorLabel: "Workstation NODE-B · 01 (retired)",
    },
    policy: {
      policyVersion: 5,
      disabledCapabilities: [
        "enrollmentCapture",
        "verificationCapture",
        "passiveFaceCheck",
        "diagnostics",
        "devicePairing",
        "settings",
      ],
      policyReason: "Decommissioned during pilot rotation.",
      updatedAt: "2026-06-10T15:00:00Z",
    },
    platform: {
      manufacturer: "Samsung",
      model: "Galaxy Tab A8",
      osVersion: "Android 12",
      appVersion: "0.8.4",
    },
    registeredAt: "2026-04-12T08:00:00Z",
    assignedAt: "2026-04-12T10:00:00Z",
    retiredAt: "2026-06-10T15:00:00Z",
    heartbeat: {
      lastSeenAt: "2026-06-10T14:55:01Z",
      status: "offline",
      batteryLevel: 0.55,
      batteryCharging: false,
      networkType: "none",
    },
  },
];

function snapshotFor(
  devices: ConsoleAndroidDevice[],
): ConsoleAndroidDevicesSnapshot {
  return {
    totals: {
      devices: devices.length,
      pending: devices.filter((d) => d.status === "pending").length,
      active: devices.filter((d) => d.status === "active").length,
      retired: devices.filter((d) => d.status === "retired").length,
    },
    devices,
  };
}

const EMPTY: ConsoleAndroidDevicesSnapshot = {
  totals: { devices: 0, pending: 0, active: 0, retired: 0 },
  devices: [],
};

/**
 * "service-degraded" scenario drops device records to simulate
 * the canonical `503 SERVICE_DEGRADED` response the live loader
 * will receive when android-device-management-service is offline.
 * The screen surfaces the empty list via the existing
 * `<EmptyState>` primitive instead of inventing partial data.
 */
const DEGRADED: ConsoleAndroidDevicesSnapshot = {
  totals: { devices: 0, pending: 0, active: 0, retired: 0 },
  devices: [],
};

export function consoleAndroidDevicesFor(
  scenario: MockScenario,
): ConsoleAndroidDevicesSnapshot {
  switch (scenario) {
    case "empty":
      return EMPTY;
    case "service-degraded":
      return DEGRADED;
    default:
      return snapshotFor(DEVICES);
  }
}

/** Exposed for the unit-test snapshot. */
export const __ANDROID_DEVICES_FIXTURE__ = DEVICES;

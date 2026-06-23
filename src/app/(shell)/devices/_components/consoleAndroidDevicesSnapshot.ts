/**
 * Console-shaped Android Devices snapshot (mock-first baseline).
 *
 * Mirrors the canonical `android-device-management-service` DTO
 * shape (Autodrome backend repo, OpenAPI v1) so future live API
 * integration drops in without restructuring this view-model.
 *
 * Naming rules (per cross-scope feature map):
 *
 *   - Lifecycle: `pending` / `active` / `retired`.
 *   - Roles: `registrar` / `vehicleVerifier`.
 *   - Binding types: `receptionPoint` / `workstation` / `vehicle`.
 *   - Policy fields: `disabledCapabilities`, `policyVersion`,
 *     `policyReason`.
 *   - Capability values: backend-owned canonical strings
 *     (`enrollmentCapture`, `verificationCapture`,
 *     `passiveFaceCheck`, `devicePairing`, `diagnostics`,
 *     `settings`). View-model source values stay canonical;
 *     operator-friendly labels live in
 *     `ANDROID_CAPABILITY_LABELS`.
 *   - Heartbeat: `lastSeenAt`, `batteryLevel`, `networkType`,
 *     `appVersion`. Reflects `AndroidDevicePlatform.appVersion`
 *     plus the inline `lastHeartbeat` snapshot.
 *
 * No Android Activity / Fragment / Composable / View class names
 * are part of this shape — that boundary lives in the mobile repo
 * per the cross-scope decision.
 */

export type ConsoleAndroidDeviceStatus =
  | "pending"
  | "active"
  | "retired";

export type ConsoleAndroidDeviceRole = "registrar" | "vehicleVerifier";

export type ConsoleAndroidDeviceBindingType =
  | "receptionPoint"
  | "workstation"
  | "vehicle";

/**
 * Canonical capability set as of the contracts-baseline review.
 * The enum is intentionally additive (per OpenAPI description) —
 * future capabilities ADD here; UI ignores unknown strings.
 */
export type ConsoleAndroidDeviceCapability =
  | "enrollmentCapture"
  | "verificationCapture"
  | "passiveFaceCheck"
  | "devicePairing"
  | "diagnostics"
  | "settings"
  | (string & {});

/**
 * Operator-friendly labels for known capability values. Source
 * values stay canonical; this lookup is rendered next to a
 * monospace canonical chip so reviewers always see the wire name.
 */
export const ANDROID_CAPABILITY_LABELS: Record<string, string> = {
  enrollmentCapture: "Enrollment capture",
  verificationCapture: "Verification capture",
  passiveFaceCheck: "Passive face check",
  devicePairing: "Device pairing / first-run",
  diagnostics: "Diagnostics",
  settings: "Runtime settings",
};

export type ConsoleAndroidDeviceBinding = {
  type: ConsoleAndroidDeviceBindingType;
  /**
   * Opaque reference into the owning service
   * (reference-data-service for `receptionPoint`/`workstation`,
   * vehicle-service for `vehicle`).
   */
  anchorId: string;
  /** Operator-friendly label resolved at fixture/loader level. */
  anchorLabel: string;
};

export type ConsoleAndroidDeviceCapabilityPolicy = {
  policyVersion: number;
  disabledCapabilities: ConsoleAndroidDeviceCapability[];
  /** Operator-supplied audit note. MUST NOT contain candidate PII. */
  policyReason?: string;
  /** Server-stamped timestamp at last update. */
  updatedAt?: string;
};

export type ConsoleAndroidDeviceHeartbeat = {
  /** Backend-stamped last-seen timestamp (any /devices/* call). */
  lastSeenAt: string;
  /** Device-reported availability at last heartbeat. */
  status: "online" | "offline" | "degraded";
  /** 0..1 fraction; `undefined` when not reported. */
  batteryLevel?: number;
  batteryCharging?: boolean;
  networkType?: "wifi" | "cellular" | "ethernet" | "none" | "other";
};

export type ConsoleAndroidDevicePlatform = {
  manufacturer: string;
  model: string;
  osVersion: string;
  appVersion: string;
};

export type ConsoleAndroidDevice = {
  id: string;
  status: ConsoleAndroidDeviceStatus;
  statusLabel: string;
  role?: ConsoleAndroidDeviceRole;
  roleLabel?: string;
  binding?: ConsoleAndroidDeviceBinding;
  policy?: ConsoleAndroidDeviceCapabilityPolicy;
  platform: ConsoleAndroidDevicePlatform;
  registeredAt: string;
  assignedAt?: string;
  retiredAt?: string;
  heartbeat?: ConsoleAndroidDeviceHeartbeat;
};

export type ConsoleAndroidDevicesSnapshot = {
  totals: {
    devices: number;
    pending: number;
    active: number;
    retired: number;
  };
  devices: ConsoleAndroidDevice[];
};

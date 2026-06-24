/**
 * Live Android Devices loader + DTO→view-model mapper + commands.
 *
 * Wires the `/devices` workspace to the typed
 * `android-device-management-service` client
 * (`api.androidDevice.*`). Mock mode keeps using scenario fixtures
 * — this module runs only when `resolveRuntimeMode() === "live"`.
 *
 * Coverage vs. canonical contract
 * (`@/contracts/types/android-device-management`):
 *
 *   - `GET /admin/devices` → `liveAndroidDevicesLoader`.
 *   - `GET /admin/devices/{deviceId}` → `liveAndroidDeviceGet`.
 *   - `POST /admin/devices/{deviceId}/assign` →
 *     `liveAndroidDeviceAssign` (Idempotency-Key per call).
 *   - `POST /admin/devices/{deviceId}/retire` →
 *     `liveAndroidDeviceRetire` (Idempotency-Key per call).
 *
 * Backend lag: per spec / track reminder "real backend support
 * may lag behind frontend wiring", admin endpoints may still
 * return `503 ANDROID_DEVICE_NOT_IMPLEMENTED` while the backend
 * application layer catches up. The shared
 * `createAutodromeClient` middleware throws an `ApiError` on any
 * non-2xx response — including 503 — so the hook layer surfaces
 * the degraded state via the existing `<ApiErrorView>` primitive.
 * `classifyError()` already categorises 503/SERVICE_DEGRADED
 * responses; the operator sees an explicit "service degraded"
 * surface instead of fake-success behavior.
 *
 * Canonical naming compliance (per cross-scope feature map):
 * lifecycle `pending`/`active`/`retired`, roles
 * `registrar`/`vehicleVerifier`, binding types
 * `receptionPoint`/`workstation`/`vehicle`, policy fields
 * `policyVersion`/`disabledCapabilities`/`policyReason`,
 * capabilities `enrollmentCapture`/`verificationCapture`/
 * `passiveFaceCheck`/`devicePairing`/`diagnostics`/`settings`.
 * Mapper preserves source values; no transformation.
 *
 * No Android Activity / Fragment / Composable / View class names
 * surface in the view-model — boundary stays in mobile repo.
 */

import type { AutodromeApi } from "@/api/adapter";
import { newCorrelationId } from "@/api/correlation";
import type { components } from "@/contracts/types/android-device-management";

import type {
  ConsoleAndroidDevice,
  ConsoleAndroidDeviceBinding,
  ConsoleAndroidDeviceCapability,
  ConsoleAndroidDeviceCapabilityPolicy,
  ConsoleAndroidDeviceHeartbeat,
  ConsoleAndroidDevicesSnapshot,
} from "./consoleAndroidDevicesSnapshot";

type AndroidDeviceDto = components["schemas"]["AndroidDevice"];
type AndroidDevicesPageDto = components["schemas"]["AndroidDevicesPage"];
type AndroidDeviceAssignmentDto =
  components["schemas"]["AndroidDeviceAssignment"];
type AndroidDeviceCapabilityPolicyUpdateDto =
  components["schemas"]["AndroidDeviceCapabilityPolicyUpdate"];
type AndroidDeviceRetireRequestDto =
  components["schemas"]["AndroidDeviceRetireRequest"];
type AndroidDeviceCapabilityPolicyDto =
  components["schemas"]["AndroidDeviceCapabilityPolicy"];
type AndroidDeviceBindingDto = components["schemas"]["AndroidDeviceBinding"];
type AndroidDeviceCapabilityDto =
  components["schemas"]["AndroidDeviceCapability"];

export function mapAndroidDeviceBindingDtoToConsole(
  dto: AndroidDeviceBindingDto,
  anchorLabel?: string,
): ConsoleAndroidDeviceBinding {
  return {
    type: dto.type,
    anchorId: dto.anchorId,
    // Anchor label is owned by reference-data-service /
    // vehicle-service; until those endpoints are wired, default to
    // the canonical anchor id so the operator always sees the
    // underlying reference.
    anchorLabel: anchorLabel ?? dto.anchorId,
  };
}

export function mapAndroidDeviceCapabilityPolicyDtoToConsole(
  dto: AndroidDeviceCapabilityPolicyDto,
): ConsoleAndroidDeviceCapabilityPolicy {
  return {
    policyVersion: dto.policyVersion,
    disabledCapabilities: [
      ...(dto.disabledCapabilities as readonly ConsoleAndroidDeviceCapability[]),
    ],
    ...(dto.policyReason !== undefined
      ? { policyReason: dto.policyReason }
      : {}),
    ...(dto.updatedAt !== undefined ? { updatedAt: dto.updatedAt } : {}),
  };
}

export function mapAndroidDeviceDtoToConsole(
  dto: AndroidDeviceDto,
  override: { anchorLabel?: string } = {},
): ConsoleAndroidDevice {
  const heartbeat: ConsoleAndroidDeviceHeartbeat | undefined =
    dto.lastHeartbeat && dto.lastSeenAt
      ? {
          lastSeenAt: dto.lastSeenAt,
          status: dto.lastHeartbeat.status ?? "offline",
          ...(dto.lastHeartbeat.batteryLevel !== undefined
            ? { batteryLevel: dto.lastHeartbeat.batteryLevel }
            : {}),
          ...(dto.lastHeartbeat.batteryCharging !== undefined
            ? { batteryCharging: dto.lastHeartbeat.batteryCharging }
            : {}),
          ...(dto.lastHeartbeat.networkType !== undefined
            ? { networkType: dto.lastHeartbeat.networkType }
            : {}),
        }
      : dto.lastSeenAt
        ? {
            lastSeenAt: dto.lastSeenAt,
            // No structured heartbeat snapshot yet — only the
            // backend-stamped lastSeenAt is available; mark device
            // status conservatively as offline so the dot/label
            // stays honest.
            status: "offline",
          }
        : undefined;

  return {
    id: dto.deviceId,
    status: dto.status,
    statusLabel: dto.status,
    ...(dto.role !== undefined
      ? { role: dto.role, roleLabel: dto.role }
      : {}),
    ...(dto.binding !== undefined
      ? {
          binding: mapAndroidDeviceBindingDtoToConsole(
            dto.binding,
            override.anchorLabel,
          ),
        }
      : {}),
    ...(dto.policy !== undefined
      ? {
          policy: mapAndroidDeviceCapabilityPolicyDtoToConsole(
            dto.policy,
          ),
        }
      : {}),
    platform: {
      manufacturer: dto.platform.manufacturer,
      model: dto.platform.model,
      osVersion: dto.platform.osVersion,
      appVersion: dto.platform.appVersion,
    },
    registeredAt: dto.registeredAt,
    ...(dto.assignedAt !== undefined ? { assignedAt: dto.assignedAt } : {}),
    ...(dto.retiredAt !== undefined ? { retiredAt: dto.retiredAt } : {}),
    ...(heartbeat !== undefined ? { heartbeat } : {}),
  };
}

function countByStatus(
  devices: readonly ConsoleAndroidDevice[],
  target: ConsoleAndroidDevice["status"],
): number {
  return devices.filter((d) => d.status === target).length;
}

/**
 * `GET /admin/devices` — paginated admin list. Maps the first page
 * into a `ConsoleAndroidDevicesSnapshot`. Pagination wiring is
 * deferred until UI scroll triggers (see tech-debt section).
 */
export async function liveAndroidDevicesLoader(
  adapter: AutodromeApi,
): Promise<ConsoleAndroidDevicesSnapshot> {
  const result = await adapter.androidDevice.GET("/admin/devices", {});
  const page = (result.data ?? { items: [] }) as AndroidDevicesPageDto;
  const devices = (page.items ?? []).map((dto) =>
    mapAndroidDeviceDtoToConsole(dto),
  );
  return {
    totals: {
      devices: devices.length,
      pending: countByStatus(devices, "pending"),
      active: countByStatus(devices, "active"),
      retired: countByStatus(devices, "retired"),
    },
    devices,
  };
}

/** `GET /admin/devices/{deviceId}` — single admin device read. */
export async function liveAndroidDeviceGet(
  adapter: AutodromeApi,
  deviceId: string,
): Promise<ConsoleAndroidDevice> {
  const result = await adapter.androidDevice.GET(
    "/admin/devices/{deviceId}",
    {
      params: { path: { deviceId } },
    },
  );
  const dto = result.data as AndroidDeviceDto | undefined;
  if (!dto) {
    throw new Error(
      "android-device-management-service returned an empty body",
    );
  }
  return mapAndroidDeviceDtoToConsole(dto);
}

/**
 * `POST /admin/devices/{deviceId}/assign` — assign role+binding
 * and optionally update capability policy. The canonical body
 * carries `role`, `binding`, optional `policy`
 * (`disabledCapabilities` + `policyReason` only — backend owns
 * `policyVersion`/`updatedAt`), optional operator audit `notes`.
 *
 * Fresh `Idempotency-Key` per call so retries don't double-apply
 * the assignment.
 */
export async function liveAndroidDeviceAssign(
  adapter: AutodromeApi,
  deviceId: string,
  assignment: AndroidDeviceAssignmentDto,
): Promise<ConsoleAndroidDevice> {
  const result = await adapter.androidDevice.POST(
    "/admin/devices/{deviceId}/assign",
    {
      params: {
        path: { deviceId },
        header: { "Idempotency-Key": newCorrelationId() },
      },
      body: assignment,
    },
  );
  const dto = result.data as AndroidDeviceDto | undefined;
  if (!dto) {
    throw new Error(
      "android-device-management-service returned an empty body for assign",
    );
  }
  return mapAndroidDeviceDtoToConsole(dto);
}

/**
 * Convenience: build an `AndroidDeviceAssignment` body that only
 * replaces the device's capability policy without re-binding. The
 * caller still passes the existing role + binding (they are
 * required by the canonical contract); this helper just trims a
 * `ConsoleAndroidDeviceCapabilityPolicy` down to the
 * operator-side write shape (`disabledCapabilities` +
 * `policyReason`) per
 * `AndroidDeviceCapabilityPolicyUpdate`.
 */
export function policyUpdateBody(
  policy: ConsoleAndroidDeviceCapabilityPolicy,
): AndroidDeviceCapabilityPolicyUpdateDto {
  return {
    disabledCapabilities: [
      ...(policy.disabledCapabilities as readonly AndroidDeviceCapabilityDto[]),
    ],
    ...(policy.policyReason !== undefined
      ? { policyReason: policy.policyReason }
      : {}),
  };
}

/**
 * Wraps `liveAndroidDeviceAssign` for the policy-editor save
 * path: takes the device's current role + binding and the new
 * policy, builds the canonical assignment body, dispatches the
 * POST. Returns the backend-stamped `ConsoleAndroidDevice` with
 * the new monotonic `policyVersion`.
 *
 * The editor calls this through
 * `useConsoleAndroidDevices.applyPolicyEdit` when live mode is on;
 * mock mode bypasses the network entirely.
 */
export async function liveAndroidDeviceApplyPolicy(
  adapter: AutodromeApi,
  device: ConsoleAndroidDevice,
  nextPolicy: ConsoleAndroidDeviceCapabilityPolicy,
): Promise<ConsoleAndroidDevice> {
  if (!device.role || !device.binding) {
    throw new Error(
      "Cannot apply capability policy: device has no role or binding " +
        "(canonical contract requires both on POST /admin/devices/{deviceId}/assign).",
    );
  }
  return liveAndroidDeviceAssign(adapter, device.id, {
    role: device.role,
    binding: {
      type: device.binding.type,
      anchorId: device.binding.anchorId,
    },
    policy: policyUpdateBody(nextPolicy),
  });
}

/**
 * `POST /admin/devices/{deviceId}/retire` — terminal lifecycle
 * transition. Fresh `Idempotency-Key` per call so retries don't
 * double-emit the retire event.
 */
export async function liveAndroidDeviceRetire(
  adapter: AutodromeApi,
  deviceId: string,
  request: AndroidDeviceRetireRequestDto = {},
): Promise<ConsoleAndroidDevice> {
  const result = await adapter.androidDevice.POST(
    "/admin/devices/{deviceId}/retire",
    {
      params: {
        path: { deviceId },
        header: { "Idempotency-Key": newCorrelationId() },
      },
      body: request,
    },
  );
  const dto = result.data as AndroidDeviceDto | undefined;
  if (!dto) {
    throw new Error(
      "android-device-management-service returned an empty body for retire",
    );
  }
  return mapAndroidDeviceDtoToConsole(dto);
}

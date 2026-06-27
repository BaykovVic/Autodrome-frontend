/**
 * Live biometry enrollment loader + commands for Web
 * camera enrollment flow.
 *
 * Wires Web camera station к canonical
 * `biometry-service` v1 enrollment-orchestration:
 *   - `POST /biometry/enrollment-launches` — launch
 *     enrollment с `webCameraStation` target.
 *   - `GET /biometry/enrollment-launches/{launchId}` —
 *     read launch state (poll for progress).
 *   - `POST /biometry/enrollment-launches/{launchId}/cancel`
 *     — operator-initiated cancellation.
 *   - `POST /biometry/enrollment-launches/{launchId}/retry`
 *     — retry from `quality_failed`.
 *
 * Per spec rule "Web enrollment не смешивается с Android
 * registrar flow": этот loader всегда выставляет target
 * `webCameraStation`. Android registrar flow остаётся в
 * mobile app (отдельный track).
 *
 * Per spec rule "Frontend не реализует face matching":
 * frontend dispatches только canonical POST/GET; ML
 * inference (template generation, quality check) — backend.
 *
 * Idempotency-Key per dispatch (UUID).
 */

import { newCorrelationId } from "@/api/correlation";
import type { AutodromeApi } from "@/api/adapter";
import type { components } from "@/contracts/types/biometry";

type EnrollmentLaunchRequestDto =
  components["schemas"]["EnrollmentLaunchRequest"];
type EnrollmentLaunchDto =
  components["schemas"]["EnrollmentLaunch"];
type EnrollmentLaunchState =
  components["schemas"]["EnrollmentLaunchState"];

export type ConsoleEnrollmentLaunch = {
  launchId: string;
  candidateId: string;
  stationId: string;
  state: EnrollmentLaunchState;
  stateLabel: string;
  enrollmentSessionId?: string;
  templateId?: string;
  retryCount: number;
  lastErrorCode?: string;
  lastErrorMessage?: string;
  createdAt: string;
  updatedAt: string;
  expiresAt: string;
};

export const ENROLLMENT_STATE_LABELS: Record<
  EnrollmentLaunchState,
  string
> = {
  ready: "Ready",
  command_sent: "Command sent",
  capturing: "Capturing",
  quality_failed: "Quality failed (retry available)",
  finalizing: "Finalizing",
  succeeded: "Succeeded",
  failed: "Failed",
  expired: "Expired",
  cancelled: "Cancelled",
};

export function isTerminalEnrollmentState(
  s: EnrollmentLaunchState,
): boolean {
  return (
    s === "succeeded" ||
    s === "failed" ||
    s === "expired" ||
    s === "cancelled"
  );
}

export function isRetriable(s: EnrollmentLaunchState): boolean {
  return s === "quality_failed";
}

function idempotencyKey(): string {
  return newCorrelationId();
}

function mapLaunchDtoToConsole(
  dto: EnrollmentLaunchDto,
): ConsoleEnrollmentLaunch {
  // For Web camera target, station id lives в target object.
  const target = dto.target as { kind: string; stationId?: string };
  return {
    launchId: dto.launchId,
    candidateId: dto.candidateRef.candidateId,
    stationId: target.stationId ?? "—",
    state: dto.state,
    stateLabel: ENROLLMENT_STATE_LABELS[dto.state],
    enrollmentSessionId: dto.enrollmentSessionId,
    templateId: dto.templateId,
    retryCount: dto.retryCount,
    lastErrorCode: dto.lastError?.code,
    lastErrorMessage: dto.lastError?.message,
    createdAt: dto.createdAt,
    updatedAt: dto.updatedAt,
    expiresAt: dto.expiresAt,
  };
}

export async function liveEnrollmentLaunch(
  adapter: AutodromeApi,
  candidateId: string,
  stationId: string,
  maskedDisplayName: string,
): Promise<ConsoleEnrollmentLaunch> {
  const body: EnrollmentLaunchRequestDto = {
    candidateRef: { candidateId },
    target: {
      kind: "webCameraStation",
      stationId,
    },
    maskedCandidateFacts: { displayName: maskedDisplayName },
  };
  const result = await adapter.biometry.POST(
    "/biometry/enrollment-launches",
    {
      body,
      params: { header: { "Idempotency-Key": idempotencyKey() } },
    },
  );
  const dto = result.data as EnrollmentLaunchDto | undefined;
  if (!dto) {
    throw new Error("Enrollment launch endpoint returned no body.");
  }
  return mapLaunchDtoToConsole(dto);
}

export async function liveEnrollmentLaunchGet(
  adapter: AutodromeApi,
  launchId: string,
): Promise<ConsoleEnrollmentLaunch> {
  const result = await adapter.biometry.GET(
    "/biometry/enrollment-launches/{launchId}",
    { params: { path: { launchId } } },
  );
  const dto = result.data as EnrollmentLaunchDto | undefined;
  if (!dto) {
    throw new Error("Enrollment launch get returned no body.");
  }
  return mapLaunchDtoToConsole(dto);
}

export async function liveEnrollmentLaunchCancel(
  adapter: AutodromeApi,
  launchId: string,
  reason?: string,
): Promise<ConsoleEnrollmentLaunch> {
  const result = await adapter.biometry.POST(
    "/biometry/enrollment-launches/{launchId}/cancel",
    {
      params: {
        path: { launchId },
        header: { "Idempotency-Key": idempotencyKey() },
      },
      body: reason ? { reason } : {},
    },
  );
  const dto = result.data as EnrollmentLaunchDto | undefined;
  if (!dto) {
    throw new Error("Enrollment cancel returned no body.");
  }
  return mapLaunchDtoToConsole(dto);
}

export async function liveEnrollmentLaunchRetry(
  adapter: AutodromeApi,
  launchId: string,
  reason?: string,
): Promise<ConsoleEnrollmentLaunch> {
  const result = await adapter.biometry.POST(
    "/biometry/enrollment-launches/{launchId}/retry",
    {
      params: {
        path: { launchId },
        header: { "Idempotency-Key": idempotencyKey() },
      },
      body: reason ? { reason } : {},
    },
  );
  const dto = result.data as EnrollmentLaunchDto | undefined;
  if (!dto) {
    throw new Error("Enrollment retry returned no body.");
  }
  return mapLaunchDtoToConsole(dto);
}

/**
 * Operator-friendly classifier for browser media-device
 * states. Frontend cannot reach `MediaDevices` API
 * directly во время render (purity), но screen может
 * запросить media и потом передать строку.
 */
export type ConsoleCameraDeviceState =
  | "ready"
  | "permission_pending"
  | "permission_denied"
  | "no_device"
  | "device_in_use"
  | "unknown";

export const CAMERA_DEVICE_STATE_LABELS: Record<
  ConsoleCameraDeviceState,
  string
> = {
  ready: "Camera ready",
  permission_pending: "Awaiting camera permission",
  permission_denied: "Camera permission denied",
  no_device: "No camera detected",
  device_in_use: "Camera busy (another app)",
  unknown: "Camera state unknown",
};

/**
 * Live installer / update loader + dispatcher.
 *
 * Wires installer surface to canonical
 * `deployment-operations-service`:
 *   - `GET /ops/install/state` →
 *     `mapInstallStateDtoToConsole(dto)`.
 *   - `POST /ops/update` → `mapUpdateJobDtoToConsole(dto)`.
 *
 * Idempotency-Key per dispatch (UUID via
 * `newCorrelationId`). Per spec rule "Не запускаем shell/
 * docker команды из browser": frontend dispatches
 * canonical POST; никакого client-side shell execution.
 */

import { newCorrelationId } from "@/api/correlation";
import type { AutodromeApi } from "@/api/adapter";
import type { components } from "@/contracts/types/deployment-operations";

import {
  INSTALLER_OVERALL_STATUS_LABELS,
  INSTALLER_PHASE_LABELS,
  UPDATE_JOB_STATUS_LABELS,
  type ConsoleInstallerOverallStatus,
  type ConsoleInstallerPhase,
  type ConsoleInstallerPrerequisite,
  type ConsoleInstallerSnapshot,
  type ConsoleUpdateJob,
  type ConsoleUpdateJobStatus,
} from "./installerSnapshot";

type InstallStateDto = components["schemas"]["InstallState"];
type PrerequisiteDto = components["schemas"]["InstallPrerequisite"];
type UpdateRequestDto = components["schemas"]["UpdateRequest"];
type UpdateJobDto = components["schemas"]["UpdateJob"];

function idempotencyKey(): string {
  return newCorrelationId();
}

export function mapPrerequisiteDtoToConsole(
  dto: PrerequisiteDto,
): ConsoleInstallerPrerequisite {
  return {
    name: dto.name,
    status: dto.status,
    reason: dto.reason,
  };
}

export function mapInstallStateDtoToConsole(
  dto: InstallStateDto,
): ConsoleInstallerSnapshot {
  const phase = dto.phase as ConsoleInstallerPhase;
  const overall = (dto.overallStatus ??
    "unknown") as ConsoleInstallerOverallStatus;
  return {
    phase,
    phaseLabel: INSTALLER_PHASE_LABELS[phase],
    version: dto.version,
    overallStatus: overall,
    overallStatusLabel: INSTALLER_OVERALL_STATUS_LABELS[overall],
    prerequisites: (dto.prerequisites ?? []).map(
      mapPrerequisiteDtoToConsole,
    ),
    degradedReasons: dto.degradedReasons ?? [],
    checkedAt: dto.checkedAt ?? "—",
    lastUpdateJob: null,
  };
}

export function mapUpdateJobDtoToConsole(
  dto: UpdateJobDto,
): ConsoleUpdateJob {
  const status = dto.status as ConsoleUpdateJobStatus;
  return {
    jobId: dto.jobId,
    packageId: dto.packageId,
    version: dto.version,
    status,
    statusLabel: UPDATE_JOB_STATUS_LABELS[status],
    startedAt: dto.startedAt,
  };
}

export async function liveInstallerLoader(
  adapter: AutodromeApi,
): Promise<ConsoleInstallerSnapshot> {
  const result = await adapter.deploymentOperations.GET(
    "/ops/install/state",
    {},
  );
  const dto = result.data as InstallStateDto | undefined;
  if (!dto) throw new Error("Install state endpoint returned no body.");
  return mapInstallStateDtoToConsole(dto);
}

export async function liveOpsStartUpdate(
  adapter: AutodromeApi,
  body: UpdateRequestDto,
): Promise<ConsoleUpdateJob> {
  const result = await adapter.deploymentOperations.POST(
    "/ops/update",
    {
      body,
      params: {
        header: { "Idempotency-Key": idempotencyKey() },
      },
    },
  );
  const dto = result.data as UpdateJobDto | undefined;
  if (!dto) throw new Error("Update endpoint returned no body.");
  return mapUpdateJobDtoToConsole(dto);
}

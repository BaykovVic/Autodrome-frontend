/**
 * Live scheduling loader over canonical
 * `scheduling-integration-service` v1:
 *
 *   - `GET /schedules`            → `SchedulesPage`
 *   - `GET /integrations/status`  → `IntegrationStatusPage`
 *
 * Fields the contracts do not carry are not invented: `Schedule` has
 * no lifecycle status (rendered "—"), and `IntegrationState` reports
 * `attempts`, not a pending-item count (`pendingItems` stays null).
 *
 * Errors bubble up as `ApiError` for the shared taxonomy (401 →
 * session, 403 → forbidden, unreachable → degraded).
 */

import type { AutodromeApi } from "@/api/adapter";
import type { components } from "@/contracts/types/scheduling-integration";

import type {
  ConsoleIntegrationEntry,
  ConsoleIntegrationStatus,
  ConsoleSchedule,
  ConsoleSchedulingSnapshot,
} from "./consoleSchedulingSnapshot";
import { INTEGRATION_STATUS_LABELS } from "./consoleSchedulingSnapshot";

type SchedulesPageDto = components["schemas"]["SchedulesPage"];
type ScheduleDto = components["schemas"]["Schedule"];
type IntegrationStatusPageDto =
  components["schemas"]["IntegrationStatusPage"];
type IntegrationStateDto = components["schemas"]["IntegrationState"];

const DASH = "—";

function refList(values: readonly string[] | undefined): string {
  return values && values.length > 0 ? values.join(", ") : DASH;
}

export function mapSchedule(dto: ScheduleDto): ConsoleSchedule {
  return {
    scheduleId: dto.scheduleId,
    candidateRef: refList(dto.candidates),
    examRef: refList(dto.exams),
    startsAt: dto.scheduleDate ?? dto.createdAt ?? DASH,
    // Not part of the Schedule contract — see file docstring.
    status: null,
    statusLabel: DASH,
  };
}

/** Canonical import states → the three console integration states. */
export function mapIntegrationStatus(
  status: IntegrationStateDto["status"],
): ConsoleIntegrationStatus {
  switch (status) {
    case "succeeded":
      return "ok";
    case "failed":
      return "failed";
    case "pending":
    case "retrying":
    default:
      return "degraded";
  }
}

export function mapIntegration(
  dto: IntegrationStateDto,
): ConsoleIntegrationEntry {
  const status = mapIntegrationStatus(dto.status);
  return {
    integrationId: dto.integrationId,
    source: dto.system ?? DASH,
    status,
    statusLabel: INTEGRATION_STATUS_LABELS[status],
    lastImportAt: dto.updatedAt ?? DASH,
    lastError: dto.lastError,
    // `attempts` is a retry counter, not a pending-item count.
    pendingItems: null,
  };
}

export async function liveSchedulingLoader(
  adapter: AutodromeApi,
): Promise<ConsoleSchedulingSnapshot> {
  const [schedulesResult, integrationsResult] = await Promise.all([
    adapter.schedulingIntegration.GET("/schedules", {}),
    adapter.schedulingIntegration.GET("/integrations/status", {}),
  ]);

  const schedulesDto = schedulesResult.data as SchedulesPageDto | undefined;
  const integrationsDto = integrationsResult.data as
    | IntegrationStatusPageDto
    | undefined;

  return {
    schedules: (schedulesDto?.items ?? []).map(mapSchedule),
    integrations: (integrationsDto?.items ?? []).map(mapIntegration),
    degradedNote:
      "Schedule lifecycle status and integration pending counts are not part of the canonical read models.",
  };
}

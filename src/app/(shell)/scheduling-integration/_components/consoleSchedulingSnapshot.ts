/**
 * Console-shaped scheduling integration view-model.
 *
 * Surfaces canonical `scheduling-integration-service` v1:
 *   - Schedules list (`GET /schedules`).
 *   - Integration import status (`GET /integrations/status`).
 *
 * Per spec rule: workspace scoped только на
 * scheduling-integration.
 */

export type ConsoleScheduleStatus =
  | "scheduled"
  | "completed"
  | "cancelled"
  | "rescheduled";

export type ConsoleSchedule = {
  scheduleId: string;
  candidateRef: string;
  examRef: string;
  startsAt: string;
  /**
   * `null` in live mode: `Schedule` carries no lifecycle status —
   * rendered as "—" rather than assumed "Scheduled".
   */
  status: ConsoleScheduleStatus | null;
  statusLabel: string;
};

export type ConsoleIntegrationStatus = "ok" | "degraded" | "failed";

export type ConsoleIntegrationEntry = {
  integrationId: string;
  source: string;
  status: ConsoleIntegrationStatus;
  statusLabel: string;
  lastImportAt: string;
  lastError?: string;
  /** `null` when the backend reports attempts but not a pending count. */
  pendingItems: number | null;
};

export type ConsoleSchedulingSnapshot = {
  schedules: ConsoleSchedule[];
  integrations: ConsoleIntegrationEntry[];
  degradedNote?: string;
};

export const SCHEDULE_STATUS_LABELS: Record<
  ConsoleScheduleStatus,
  string
> = {
  scheduled: "Scheduled",
  completed: "Completed",
  cancelled: "Cancelled",
  rescheduled: "Rescheduled",
};

export const INTEGRATION_STATUS_LABELS: Record<
  ConsoleIntegrationStatus,
  string
> = {
  ok: "OK",
  degraded: "Degraded",
  failed: "Failed",
};
